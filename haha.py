import cv2
import numpy as np

# Đọc ảnh đã cắt vuông
img = cv2.imread(r'C:\Todaii-Agnes.github.io\assets\image-Photoroom.png')
h, w, _ = img.shape

# Cắt bớt phần mặt nước dưới đáy nếu muốn (chỉnh tỷ lệ 0.88 hoặc 1.0 tùy ý)
clean_crop = img[0:int(h*0.88), 0:w]
b, g, r = cv2.split(clean_crop)

# Thu nhỏ cửa sổ hiển thị một chút cho vừa màn hình laptop
display_scale = 0.7
b_small = cv2.resize(b, (0, 0), fx=display_scale, fy=display_scale)

def nothing(x):
    pass

cv2.namedWindow('Shorekeeper Edge Tuner')
# Tạo 4 thanh trượt: Min/Max Canny, độ mịn khử nhiễu, và độ dày nét
cv2.createTrackbar('MinVal', 'Shorekeeper Edge Tuner', 45, 255, nothing)
cv2.createTrackbar('MaxVal', 'Shorekeeper Edge Tuner', 130, 255, nothing)
cv2.createTrackbar('Blur', 'Shorekeeper Edge Tuner', 5, 15, nothing)
cv2.createTrackbar('Dilate', 'Shorekeeper Edge Tuner', 0, 3, nothing)

while True:
    min_val = cv2.getTrackbarPos('MinVal', 'Shorekeeper Edge Tuner')
    max_val = cv2.getTrackbarPos('MaxVal', 'Shorekeeper Edge Tuner')
    blur_val = cv2.getTrackbarPos('Blur', 'Shorekeeper Edge Tuner')
    dilate_val = cv2.getTrackbarPos('Dilate', 'Shorekeeper Edge Tuner')

    # Đảm bảo kernel blur luôn là số lẻ >= 1
    k_blur = blur_val if blur_val % 2 == 1 else blur_val + 1
    smooth = cv2.GaussianBlur(b_small, (k_blur, k_blur), 0)

    edges = cv2.Canny(smooth, min_val, max_val)

    if dilate_val > 0:
        kernel = np.ones((2, 2), np.uint8)
        edges = cv2.dilate(edges, kernel, iterations=dilate_val)

    cv2.imshow('Shorekeeper Edge Tuner', edges)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('s'):  # Bấm phím S để lưu bản gốc độ phân giải cao với thông số vừa chỉnh
        smooth_full = cv2.GaussianBlur(b, (k_blur, k_blur), 0)
        edges_full = cv2.Canny(smooth_full, min_val, max_val)
        if dilate_val > 0:
            edges_full = cv2.dilate(edges_full, np.ones((2, 2), np.uint8), iterations=dilate_val)
        cv2.imwrite(r'C:\Todaii-Agnes.github.io\assets\shorekeeper-edges.png', edges_full)
        print(f"Đã lưu! (Min={min_val}, Max={max_val}, Blur={k_blur}, Dilate={dilate_val})")
        break
    elif key == 27:  # Bấm ESC để thoát
        break

cv2.destroyAllWindows()