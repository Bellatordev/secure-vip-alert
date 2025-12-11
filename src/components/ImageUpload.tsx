import { useRef, useState } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

export function ImageUpload({ onUpload, disabled }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  
  const handleClick = () => {
    inputRef.current?.click();
  };
  
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('Please upload JPG or PNG images only');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be under 10MB');
      return;
    }
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Upload
    setIsUploading(true);
    try {
      await onUpload(file);
    } finally {
      setIsUploading(false);
      setPreview(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };
  
  const clearPreview = () => {
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };
  
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleChange}
        className="hidden"
      />
      
      <Button
        variant="tactical"
        size="icon"
        onClick={handleClick}
        disabled={disabled || isUploading}
        className="rounded-full"
      >
        {isUploading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Camera className="w-5 h-5" />
        )}
      </Button>
      
      {/* Preview overlay */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4">
          <div className="relative max-w-sm w-full">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full rounded-xl border border-border shadow-panel"
            />
            
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
            
            <button
              onClick={clearPreview}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
