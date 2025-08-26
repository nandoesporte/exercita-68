
import { useState, useRef } from 'react';
import { useGymPhotos } from '@/hooks/useGymPhotos';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Trash2, Image } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const GymPhotos = () => {
  const { user } = useAuth();
  const { photos, isLoading, uploading, uploadPhoto, deletePhoto } = useGymPhotos();
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadPhoto(file, description);
      setDescription('');
      event.target.value = '';
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeletePhoto = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta foto?')) {
      deletePhoto(id);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
        <h2 className="text-2xl font-bold text-white">Faça login para enviar fotos</h2>
        <p className="text-gray-300">
          É necessário estar logado para enviar fotos da sua academia.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Envie fotos da sua academia</h1>
        <p className="text-lg text-gray-200 mb-6">
          Estas fotos serão utilizadas pelo personal trainer para analisar o ambiente e montar seus planos de treino personalizados.
        </p>
        
        <div className="fitness-card bg-fitness-darkGray p-6 rounded-xl mb-8">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-white mb-2 font-medium">
              Descrição (opcional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-fitness-dark border border-gray-600 rounded-lg p-3 text-white"
              placeholder="Ex: Área de musculação, Esteiras, etc."
              disabled={uploading}
              rows={3}
            />
          </div>
          
          <Button
            onClick={handleUploadClick}
            className="w-full justify-center gap-2 bg-fitness-orange hover:bg-fitness-orange/80 text-white font-medium py-3 rounded-lg"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Camera size={20} />
                <span className="text-lg">Enviar foto da academia</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fitness-orange"></div>
        </div>
      ) : photos.length > 0 ? (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Suas fotos enviadas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="fitness-card bg-fitness-darkGray rounded-lg overflow-hidden">
                <Dialog>
                  <DialogTrigger asChild>
                    <div 
                      className="relative h-48 w-full cursor-pointer"
                      onClick={() => setSelectedPhoto(photo.photo_url)}
                    >
                      <img
                        src={photo.photo_url}
                        alt="Foto da academia"
                        className="h-full w-full object-cover"
                      />
                      {photo.approved && (
                        <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 text-xs rounded">
                          Aprovada
                        </div>
                      )}
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl bg-fitness-darkGray border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Foto da academia</DialogTitle>
                    </DialogHeader>
                    <div className="mt-2">
                      <img
                        src={selectedPhoto || ''}
                        alt="Foto da academia em tamanho maior"
                        className="w-full object-contain max-h-[70vh]"
                      />
                      {photo.description && (
                        <p className="mt-4 text-white">{photo.description}</p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                
                <div className="p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">
                      {format(new Date(photo.created_at), 'dd/MM/yyyy HH:mm')}
                    </span>
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="text-red-500 hover:text-red-400"
                      title="Excluir foto"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  {photo.description && (
                    <p className="text-gray-300 text-sm mt-1 line-clamp-2">{photo.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-10 text-center bg-fitness-darkGray/40 rounded-lg">
          <Image size={48} className="text-gray-500" />
          <h3 className="text-xl font-medium text-white">Nenhuma foto enviada</h3>
          <p className="text-gray-300 max-w-md">
            Envie fotos da sua academia para que o personal trainer possa analisar e criar um plano de treino personalizado.
          </p>
        </div>
      )}
    </div>
  );
};

export default GymPhotos;
