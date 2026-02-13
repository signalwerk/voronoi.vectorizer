import { useCallback } from "react";
import "./dropzone.css";

interface DropzoneProps {
  onImageLoad: (file: File, image: HTMLImageElement) => void;
}

export function Dropzone({ onImageLoad }: DropzoneProps) {
  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file (PNG, JPEG, WebP)");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          onImageLoad(file, img);
        };
        img.onerror = () => {
          alert("Failed to load image");
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [onImageLoad],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/jpg,image/webp";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFile(file);
      }
    };
    input.click();
  }, [handleFile]);

  return (
    <div
      className="dropzone"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleClick}
    >
      <div className="dropzone__content">
        <div className="dropzone__icon">📁</div>
        <div className="dropzone__text">
          Drop an image here or click to upload
        </div>
        <div className="dropzone__hint">Supports PNG, JPEG, WebP</div>
      </div>
    </div>
  );
}
