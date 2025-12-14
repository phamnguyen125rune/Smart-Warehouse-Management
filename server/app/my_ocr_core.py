# app/my_ocr_core.py

import os
import cv2
import numpy as np
import torch
import logging
import traceback 
from collections import Counter

# --- 1. VÁ LỖI PILLOW (BẮT BUỘC CHO VIETOCR) ---
import PIL.Image
from PIL import Image
if not hasattr(PIL.Image, 'ANTIALIAS'):
    PIL.Image.ANTIALIAS = PIL.Image.LANCZOS
    PIL.Image.BICUBIC = PIL.Image.Resampling.BICUBIC

# --- 2. IMPORT CÁC THƯ VIỆN AI ---
from paddleocr import PaddleOCR
from transformers import LayoutLMv3ForTokenClassification, LayoutLMv3Processor

# Import VietOCR
from vietocr.tool.predictor import Predictor
from vietocr.tool.config import Cfg

# Tắt log rác và OneDNN để tránh xung đột
logging.getLogger("ppocr").setLevel(logging.ERROR)
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["FLAGS_use_mkldnn"] = "False"
os.environ["FLAGS_use_cuda"] = "False"
os.environ["CUDA_VISIBLE_DEVICES"] = ""
os.environ["FLAGS_enable_parallel_graph"] = "False"

# Định nghĩa các Label mapping cứng
HEADER_MAP = {
    "ItemNameValue": "ItemName",
    "QuantityValue": "Quantity",
    "UnitPriceValue": "UnitPrice",
    "AmountValue": "Amount"
}

class InvoiceRecognizer:
    def __init__(self, model_dir="./"):
        """
        Khởi tạo Model: Paddle (Det) + VietOCR (Rec) + LayoutLMv3 (IE)
        """
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"⚙️ [Core AI] Đang khởi tạo trên thiết bị: {self.device}")

        # --- A. Load PaddleOCR (Chỉ dùng Detection) ---
        det_path = os.path.join(model_dir, "ocr_models/ch_PP-OCRv3_det_infer")
        rec_path = os.path.join(model_dir, "ocr_models/ch_PP-OCRv3_rec_infer") 
        cls_path = os.path.join(model_dir, "ocr_models/ch_ppocr_mobile_v2.0_cls_infer")

        if not os.path.exists(det_path):
            raise FileNotFoundError(f"Không tìm thấy model OCR tại: {det_path}")

        print("[Core AI] Loading PaddleOCR (Detector)...")
        self.ocr_engine = PaddleOCR(
            use_angle_cls=False, # Tắt CLS để tránh lỗi Numpy
            lang='ch',
            det_model_dir=det_path,
            rec_model_dir=rec_path,
            cls_model_dir=cls_path,
            use_gpu=(self.device == 'cuda'),
            show_log=False,
            det_db_unclip_ratio=1.5,
            det_db_box_thresh=0.5,
            det_db_thresh=0.3
        )

        # --- B. Load VietOCR (Recognition) ---
        print("[Core AI] Loading VietOCR (Recognizer)...")
        try:
            config = Cfg.load_config_from_name('vgg_seq2seq')
            config['cnn']['pretrained'] = False
            config['device'] = 'cpu'
            self.vietocr = Predictor(config)
        except Exception as e:
            print(f"❌ [Core AI] Lỗi load VietOCR: {e}")
            raise e

        # --- C. Load LayoutLMv3 ---
        print("[Core AI] Loading LayoutLMv3...")
        layout_model_path = os.path.join(model_dir, "final_model")
        if not os.path.exists(layout_model_path):
            raise FileNotFoundError(f"Không tìm thấy LayoutLMv3 tại: {layout_model_path}")
            
        self.model = LayoutLMv3ForTokenClassification.from_pretrained(layout_model_path).to(self.device)
        self.processor = LayoutLMv3Processor.from_pretrained(layout_model_path, apply_ocr=False)
        
        print("✅ [Core AI] Tất cả Model đã sẵn sàng!")

    def aggressive_preprocess(self, pil_image):
        """Xử lý ảnh bằng OpenCV để tách chữ dính"""
        try:
            img = np.array(pil_image)
            if len(img.shape) == 3:
                gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
            else:
                gray = img
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            kernel = np.ones((2, 2), np.uint8)
            eroded = cv2.erode(binary, kernel, iterations=1)
            final_img = cv2.cvtColor(eroded, cv2.COLOR_GRAY2RGB)
            return Image.fromarray(final_img)
        except Exception as e:
            print(f"⚠️ Lỗi preprocess, dùng ảnh gốc: {e}")
            return pil_image

    def normalize_box(self, box, width, height):
        return [
            int(max(0, min(1000, box[0] / width * 1000))),
            int(max(0, min(1000, box[1] / height * 1000))),
            int(max(0, min(1000, box[2] / width * 1000))),
            int(max(0, min(1000, box[3] / height * 1000)))
        ]

    def predict(self, image_path_or_file):
        """
        Hàm chính: Paddle (Det) -> VietOCR (Rec) -> LayoutLMv3 -> Result
        """
        # Load ảnh
        image = Image.open(image_path_or_file).convert("RGB")
        w_orig, h_orig = image.size
        
        # 1. Preprocess
        processed_img = self.aggressive_preprocess(image)
        img_array = np.array(processed_img)
        
        # 2. OCR Pipeline
        words = []
        boxes = []
        
        try:
            # A. Detection
            dt_boxes, _ = self.ocr_engine.text_detector(img_array)
            
            if dt_boxes is None or (isinstance(dt_boxes, np.ndarray) and dt_boxes.size == 0):
                print("⚠️ [OCR] Không tìm thấy vùng chữ nào.")
                return []
                
            if isinstance(dt_boxes, np.ndarray):
                dt_boxes = dt_boxes.tolist()

            # B. Recognition
            for i, box in enumerate(dt_boxes):
                try:
                    x_vals = [c[0] for c in box]
                    y_vals = [c[1] for c in box]
                    x1, y1 = min(x_vals), min(y_vals)
                    x2, y2 = max(x_vals), max(y_vals)
                    
                    if x2 <= x1 or y2 <= y1: continue
                    
                    cropped = processed_img.crop((int(x1), int(y1), int(x2), int(y2)))
                    text = self.vietocr.predict(cropped)
                    
                    if not text.strip(): continue
                    
                    norm_box = self.normalize_box([x1, y1, x2, y2], w_orig, h_orig)
                    words.append(text)
                    boxes.append(norm_box)
                    
                except Exception:
                    continue 
                    
        except Exception as e:
            print(f"❌ [OCR Error] Lỗi trong quá trình OCR: {e}")
            traceback.print_exc()
            return []

        if not words:
            return []

        # 3. Inference LayoutLMv3
        try:
            encoding = self.processor(
                images=[image], text=[words], boxes=[boxes],
                return_tensors="pt", truncation=True, padding="max_length", max_length=512
            )
            for k, v in encoding.items(): encoding[k] = v.to(self.device)

            with torch.no_grad():
                outputs = self.model(**encoding)

            predictions = outputs.logits.argmax(-1).squeeze().tolist()
            word_ids = encoding.word_ids()
            id2label = self.model.config.id2label
            
            final_labels = []
            word_labels_map = {}
            for idx, word_id in enumerate(word_ids):
                if word_id is None: continue
                if word_id not in word_labels_map: word_labels_map[word_id] = []
                word_labels_map[word_id].append(id2label[predictions[idx]])

            for i in range(len(words)):
                if i in word_labels_map:
                    counts = Counter(word_labels_map[i])
                    final_labels.append(counts.most_common(1)[0][0])
                else:
                    final_labels.append("O")

            # 4. Post-processing
            structured_rows = self._clean_and_group_data(words, final_labels, boxes, h_orig)
            
            # 5. Output Formatting (CẬP NHẬT DẤU NGĂN CÁCH)
            output_lines = []
            for row in structured_rows:
                name = row.get("ItemName", "")
                qty = row.get("Quantity", "1").replace(",", ".")
                price = row.get("UnitPrice", "0").replace(",", "").replace(".", "")
                amount = row.get("Amount", "0").replace(",", "").replace(".", "")

                if name:
                    # [QUAN TRỌNG] Thêm dấu gạch đứng | vào đây
                    line_str = f"{name} | {qty} | {amount} | {price}"
                    output_lines.append(line_str)
                    
            return output_lines

        except Exception as e:
            print(f"❌ [AI Error] Lỗi phân tích LayoutLM: {e}")
            traceback.print_exc()
            return []

    # --- CÁC HÀM HỖ TRỢ ---

    def _is_same_line(self, box1, box2, img_height, iou_threshold=0.5):
        y1_a, y2_a = box1[1], box1[3]
        y1_b, y2_b = box2[1], box2[3]
        overlap_y1 = max(y1_a, y1_b)
        overlap_y2 = min(y2_a, y2_b)
        if overlap_y2 <= overlap_y1: return False
        intersection = overlap_y2 - overlap_y1
        min_height = min(y2_a - y1_a, y2_b - y1_b)
        if min_height == 0: return False
        return (intersection / min_height) > iou_threshold

    def _clean_and_group_data(self, words, labels, boxes, h_img):
        entities = []
        for word, label, box in zip(words, labels, boxes):
            clean_label = label.replace("B-", "").replace("I-", "")
            if clean_label in HEADER_MAP:
                entities.append({
                    "text": word, "label": HEADER_MAP[clean_label], 
                    "box": box, "center_y": (box[1] + box[3]) / 2, "x1": box[0]
                })

        if not entities: return []
        entities.sort(key=lambda x: x["center_y"])

        physical_rows = []
        if entities:
            current_row = [entities[0]]
            for i in range(1, len(entities)):
                curr_ent = entities[i]
                ref_ent = current_row[0] 
                if self._is_same_line(ref_ent["box"], curr_ent["box"], h_img):
                    current_row.append(curr_ent)
                else:
                    physical_rows.append(current_row)
                    current_row = [curr_ent]
            if current_row: physical_rows.append(current_row)

        final_rows_data = []
        i = 0
        while i < len(physical_rows):
            curr_row = physical_rows[i]
            
            curr_has_name = any(e['label'] == 'ItemName' for e in curr_row)
            curr_has_price = any(e['label'] in ['Amount', 'UnitPrice'] for e in curr_row)
            
            if (curr_has_name and not curr_has_price) and (i + 1 < len(physical_rows)):
                next_row = physical_rows[i+1]
                next_has_price = any(e['label'] in ['Amount', 'UnitPrice'] for e in next_row)
                if next_has_price:
                    curr_row.extend(next_row)
                    i += 1
            
            curr_row.sort(key=lambda x: x["x1"])
            row_dict = { "ItemName": "", "Quantity": "", "UnitPrice": "", "Amount": "" }
            
            for ent in curr_row:
                key = ent["label"]
                if row_dict[key]: row_dict[key] += " " + ent["text"]
                else: row_dict[key] = ent["text"]
            
            if row_dict["ItemName"]:
                final_rows_data.append(row_dict)
            
            i += 1
            
        return final_rows_data