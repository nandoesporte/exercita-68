import React, { useState, useMemo } from 'react';
import { useGymPhotos } from '@/hooks/useGymPhotos';
import { Button } from '@/components/ui/button';
import { Check, X, Eye, User, GalleryHorizontal, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

const GymPhotoManagement = () => {
  const { allPhotos, isLoadingAll, updateApprovalStatus } = useGymPhotos();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Filter photos based on tab and search query
  const filteredPhotos = useMemo(() => {
    let photos = allPhotos;
    
    // Filter by tab
    if (activeTab === 'pending') {
      photos = allPhotos.filter(photo => !photo.approved);
    } else if (activeTab === 'approved') {
      photos = allPhotos.filter(photo => photo.approved);
    }
    
    // Filter by search query (user name)
    if (searchQuery.trim()) {
      photos = photos.filter(photo => {
        const firstName = photo.profiles?.first_name || '';
        const lastName = photo.profiles?.last_name || '';
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase());
      });
    }
    
    return photos;
  }, [allPhotos, activeTab, searchQuery]);

  const pendingPhotos = allPhotos.filter(photo => !photo.approved);
  const approvedPhotos = allPhotos.filter(photo => photo.approved);
  
  const handleApprove = (photoId: string) => {
    updateApprovalStatus({ photoId, approved: true });
  };
  
  const handleReject = (photoId: string) => {
    if (confirm('Deseja rejeitar esta foto?')) {
      updateApprovalStatus({ photoId, approved: false });
    }
  };
  
  if (isLoadingAll) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fitness-orange"></div>
      </div>
    );
  }

  return (
    <div className="container p-4 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <GalleryHorizontal className="h-7 w-7 text-fitness-green" />
        <h1 className="text-3xl font-bold text-[#000000] tracking-tight">
          Gerenciamento de Fotos
        </h1>
      </div>
      
      <p className="text-lg text-[#000000e6] dark:text-gray-300 mb-6 max-w-3xl leading-relaxed">
        Aprove ou rejeite fotos enviadas pelos usuários para análise do ambiente da academia.
        Todas as fotos são identificadas com o nome do usuário que as enviou.
      </p>
      
      {/* Search bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            className="pl-10 bg-white dark:bg-fitness-darkGray border-gray-200 dark:border-gray-700 text-[#222222] dark:text-white"
            placeholder="Filtrar por usuário..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="all" className="text-base font-medium">
            Todas ({allPhotos.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-base font-medium">
            Pendentes ({pendingPhotos.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="text-base font-medium">
            Aprovadas ({approvedPhotos.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <PhotoGrid
            photos={filteredPhotos}
            handleApprove={handleApprove}
            handleReject={handleReject}
            setSelectedPhoto={setSelectedPhoto}
            selectedPhoto={selectedPhoto}
            searchQuery={searchQuery}
          />
        </TabsContent>
        
        <TabsContent value="pending">
          <PhotoGrid
            photos={filteredPhotos}
            handleApprove={handleApprove}
            handleReject={handleReject}
            setSelectedPhoto={setSelectedPhoto}
            selectedPhoto={selectedPhoto}
            searchQuery={searchQuery}
          />
        </TabsContent>
        
        <TabsContent value="approved">
          <PhotoGrid
            photos={filteredPhotos}
            handleApprove={handleApprove}
            handleReject={handleReject}
            setSelectedPhoto={setSelectedPhoto}
            selectedPhoto={selectedPhoto}
            searchQuery={searchQuery}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface PhotoGridProps {
  photos: any[];
  handleApprove: (id: string) => void;
  handleReject: (id: string) => void;
  setSelectedPhoto: (url: string | null) => void;
  selectedPhoto: string | null;
  searchQuery: string;
}

const PhotoGrid = ({ photos, handleApprove, handleReject, setSelectedPhoto, selectedPhoto, searchQuery }: PhotoGridProps) => {
  if (photos.length === 0) {
    return (
      <div className="text-center py-16 bg-fitness-darkGray/40 rounded-lg">
        {searchQuery ? (
          <p className="text-xl text-[#222222] dark:text-gray-300 font-medium">Nenhuma foto encontrada para este usuário</p>
        ) : (
          <p className="text-xl text-[#222222] dark:text-gray-300 font-medium">Nenhuma foto encontrada nesta categoria</p>
        )}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {photos.map((photo: any) => (
        <div key={photo.id} className="bg-fitness-darkGray rounded-lg overflow-hidden shadow-lg border border-gray-700/50">
          <Dialog>
            <DialogTrigger asChild>
              <div 
                className="relative h-60 w-full cursor-pointer"
                onClick={() => setSelectedPhoto(photo.photo_url)}
              >
                <img
                  src={photo.photo_url}
                  alt="Foto da Academia"
                  className="h-full w-full object-cover"
                />
                
                {/* User badge overlay */}
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 ring-2 ring-white/20">
                      <AvatarFallback className="bg-fitness-green text-[10px]">
                        {photo.profiles?.first_name?.[0]}{photo.profiles?.last_name?.[0] || ''}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-white text-sm font-medium">
                      {photo.profiles?.first_name} {photo.profiles?.last_name}
                    </span>
                  </div>
                </div>
                
                {photo.approved && (
                  <div className="absolute bottom-3 right-3 bg-green-600 text-white px-3 py-1 text-xs font-semibold rounded-full">
                    Aprovada
                  </div>
                )}
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl bg-fitness-darkGray border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <GalleryHorizontal className="h-5 w-5" /> Foto da Academia
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <img
                  src={selectedPhoto || ''}
                  alt="Foto da academia em tamanho completo"
                  className="w-full object-contain max-h-[70vh] rounded-md border border-gray-700/50"
                />
                <div className="mt-6 p-4 bg-fitness-dark/50 rounded-lg border border-gray-700/30">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar>
                      <AvatarFallback className="bg-fitness-green">
                        {photo.profiles?.first_name?.[0]}{photo.profiles?.last_name?.[0] || ''}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-white text-lg font-semibold">
                        {photo.profiles?.first_name} {photo.profiles?.last_name}
                      </h3>
                      <p className="text-[#aaadb0] text-sm">
                        Enviado em {format(new Date(photo.created_at), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  
                  {photo.description && (
                    <div className="mt-3 border-t border-gray-700/30 pt-3">
                      <p className="text-white text-base leading-relaxed">
                        <span className="font-medium text-[#aaadb0]">Descrição:</span> {photo.description}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(photo.id)}
                    className="gap-2 px-4 py-2 text-base"
                  >
                    <X size={20} /> Rejeitar
                  </Button>
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 gap-2 px-4 py-2 text-base"
                    onClick={() => handleApprove(photo.id)}
                  >
                    <Check size={20} /> Aprovar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-fitness-green text-xs">
                    {photo.profiles?.first_name?.[0]}{photo.profiles?.last_name?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
                <span className="text-white text-base font-medium line-clamp-1">
                  {photo.profiles?.first_name} {photo.profiles?.last_name}
                </span>
              </div>
              <span className="text-[#aaadb0] text-xs">
                {format(new Date(photo.created_at), 'dd/MM/yyyy')}
              </span>
            </div>
            
            {photo.description && (
              <p className="text-[#aaadb0] text-sm mt-2 mb-3 line-clamp-2">{photo.description}</p>
            )}
            
            <div className="flex justify-end gap-1 mt-2 border-t border-gray-700/30 pt-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8"
                    onClick={() => setSelectedPhoto(photo.photo_url)}
                  >
                    <Eye size={16} className="mr-1" /> Ver
                  </Button>
                </DialogTrigger>
              </Dialog>
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 text-red-500 hover:text-red-400 hover:bg-red-950/30"
                onClick={() => handleReject(photo.id)}
              >
                <X size={16} className="mr-1" /> Rejeitar
              </Button>
              <Button 
                variant="outline"
                size="sm" 
                className="h-8 text-green-500 hover:text-green-400 hover:bg-green-950/30"
                onClick={() => handleApprove(photo.id)}
              >
                <Check size={16} className="mr-1" /> Aprovar
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GymPhotoManagement;
