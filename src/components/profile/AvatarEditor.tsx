import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

type Point = { x: number; y: number };
type Area = { x: number; y: number; width: number; height: number };
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, ZoomIn, ZoomOut } from 'lucide-react';

interface AvatarEditorProps {
  image: string;
  onSave: (croppedImage: Blob) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Não foi possível criar contexto do canvas');
  }

  // Define o tamanho do canvas para 400x400 (tamanho final do avatar)
  const targetSize = 400;
  canvas.width = targetSize;
  canvas.height = targetSize;

  // Desenha a imagem recortada e redimensionada
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetSize,
    targetSize
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Falha ao criar blob da imagem'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
}

export function AvatarEditor({ image, onSave, onCancel, isOpen }: AvatarEditorProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setIsSaving(true);
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      await onSave(croppedImage);
    } catch (e) {
      console.error('Erro ao recortar imagem:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ajustar Foto de Perfil</DialogTitle>
          <DialogDescription>
            Ajuste o zoom e a posição da sua foto. A área circular será sua foto de perfil.
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex-1 bg-black rounded-lg overflow-hidden">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4">
            <ZoomOut className="h-5 w-5 text-muted-foreground" />
            <Slider
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              min={1}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Use o controle deslizante para ajustar o zoom. Arraste a imagem para reposicionar.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Foto'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
