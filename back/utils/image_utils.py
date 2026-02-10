import os
from PIL import Image
import werkzeug


def create_lowered_image(image_path, quality=60, max_width=800):
    """
    Create a compressed/lowered version of an image.

    Args:
        image_path: Full path to the original image
        quality: JPEG quality (1-100), lower = more compression
        max_width: Maximum width for the lowered image

    Returns:
        Path to the lowered image file
    """
    try:
        # Open the image
        img = Image.open(image_path)

        # Convert RGBA to RGB if needed (for JPEG compatibility)
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background

        # Resize if width exceeds max_width
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

        # Create lowered filename
        base, ext = os.path.splitext(image_path)
        lowered_path = f"{base}_lowered.jpg"  # Always save as JPEG for compression

        # Save compressed version
        img.save(lowered_path, 'JPEG', quality=quality, optimize=True)

        return lowered_path
    except Exception as e:
        print(f"Error creating lowered image: {e}")
        return None


def upload_image_with_compression(file, upload_folder, url_prefix, quality=60, max_width=800):
    """
    Upload an image file and create a compressed version.

    Args:
        file: werkzeug.datastructures.FileStorage object from request.files
        upload_folder: Absolute path to the folder where images will be saved
        url_prefix: URL prefix for accessing the image (e.g., "/formations/image" or "/week_problems/image")
        quality: JPEG quality for compressed version (1-100)
        max_width: Maximum width for the compressed version

    Returns:
        Dictionary with 'image_url' and 'image_url_lowered' or error message
    """
    if not file or file.filename == '':
        return {'message': 'Empty filename.'}, 400

    # Secure the filename
    filename = werkzeug.utils.secure_filename(file.filename)
    save_path = os.path.join(upload_folder, filename)

    # Ensure unique filename
    base, ext = os.path.splitext(filename)
    counter = 1
    while os.path.exists(save_path):
        filename = f"{base}_{counter}{ext}"
        save_path = os.path.join(upload_folder, filename)
        counter += 1

    # Save original file
    file.save(save_path)

    # Create lowered version
    lowered_path = create_lowered_image(save_path, quality=quality, max_width=max_width)

    # Prepare response
    image_url = f"{url_prefix}/{filename}"
    response = {'image_url': image_url}

    if lowered_path:
        lowered_filename = os.path.basename(lowered_path)
        response['image_url_lowered'] = f"{url_prefix}/{lowered_filename}"

    return response, 201
