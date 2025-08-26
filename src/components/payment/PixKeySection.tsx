
import React, { useState } from 'react';
import { Edit, Key, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast-wrapper';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PixKeySectionProps {
  savedPixKey: string;
  setSavedPixKey: (value: string) => void;
  savedPixKeyType: string;
  setSavedPixKeyType: (value: string) => void;
}

const PixKeySection = ({
  savedPixKey,
  setSavedPixKey,
  savedPixKeyType,
  setSavedPixKeyType
}: PixKeySectionProps) => {
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [isEditingPix, setIsEditingPix] = useState(false);
  const { user, isAdmin } = useAuth();

  const handleSavePix = async () => {
    if (!pixKey) {
      toast('Digite uma chave PIX válida');
      return;
    }
    
    try {
      console.log("Saving user PIX key:", { pixKeyType, pixKey });
      
      if (user) {
        // If the user is an admin, they can use the pix_keys table
        if (isAdmin) {
          console.log("Admin is saving PIX key to pix_keys table");
          
          // First check if there are any existing PIX keys
          const { data: existingKeys } = await supabase
            .from('pix_keys')
            .select('id, is_primary')
            .limit(1);
            
          const isPrimary = !existingKeys || existingKeys.length === 0;
          
          // Insert the new PIX key
          const { error: insertError } = await supabase
            .from('pix_keys')
            .insert({
              key_type: pixKeyType,
              key_value: pixKey,
              recipient_name: user.user_metadata?.first_name ? 
                `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim() : 
                'Usuário da Academia',
              is_primary: isPrimary
            });
            
          if (insertError) {
            console.error("Error inserting PIX key:", insertError);
            throw insertError;
          }
        } else {
          // Regular user - save to pix_keys table  
          console.log("Regular user saving to pix_keys table");
          
          // First check if user already has a PIX key
          const { data: existingKey, error: fetchError } = await supabase
            .from('pix_keys')
            .select('*')
            .eq('admin_id', null) // User pix keys don't have admin_id
            .single();
            
          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error("Error checking existing PIX key:", fetchError);
            throw fetchError;
          }
            
          // Update or insert PIX key
          if (existingKey) {
            const { error: updateError } = await supabase
              .from('pix_keys')
              .update({ 
                key_type: pixKeyType,
                key_value: pixKey 
              })
              .eq('id', existingKey.id);
              
            if (updateError) {
              console.error("Error updating PIX key:", updateError);
              throw updateError;
            }
          } else {
            const { error: insertError } = await supabase
              .from('pix_keys')
              .insert({
                key_type: pixKeyType,
                key_value: pixKey,
                recipient_name: user.user_metadata?.first_name ? 
                  `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim() : 
                  'Usuário da Academia',
                is_primary: true
              });
              
            if (insertError) {
              console.error("Error inserting PIX key:", insertError);
              throw insertError;
            }
          }
        }
      }
      
      // Update local state regardless
      setSavedPixKey(pixKey);
      setSavedPixKeyType(pixKeyType);
      setIsEditingPix(false);
      toast('Chave PIX salva com sucesso');
      
    } catch (error: any) {
      console.error("Error saving PIX key:", error);
      toast(`Erro ao salvar chave PIX: ${error.message || 'Falha desconhecida'}`);
    }
  };

  return (
    <div className="bg-fitness-darkGray p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-3 flex items-center">
        <Key size={18} className="mr-2 text-fitness-orange" />
        <span>Chave PIX</span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="ml-auto text-fitness-orange hover:text-fitness-orange/90"
          onClick={() => {
            if (isEditingPix) {
              handleSavePix();
            } else {
              setPixKey(savedPixKey);
              setPixKeyType(savedPixKeyType);
              setIsEditingPix(true);
            }
          }}
        >
          {isEditingPix ? <Save size={18} /> : <Edit size={18} />}
        </Button>
      </h2>
      
      {isEditingPix ? (
        <div className="mt-2">
          <div className="mb-3">
            <label htmlFor="pixKeyType" className="block text-sm mb-1">
              Tipo de Chave PIX
            </label>
            <select
              id="pixKeyType"
              value={pixKeyType}
              onChange={(e) => setPixKeyType(e.target.value)}
              className="w-full bg-fitness-dark border border-gray-700 rounded p-2"
            >
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="email">Email</option>
              <option value="phone">Telefone</option>
              <option value="random">Chave Aleatória</option>
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="pixKey" className="block text-sm mb-1">
              Chave PIX
            </label>
            <Input
              id="pixKey"
              placeholder={pixKeyType === 'email' ? 'exemplo@email.com' : '123.456.789-00'}
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              className="bg-fitness-dark border-gray-700"
            />
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={handleSavePix} 
              className="flex-1 bg-fitness-orange hover:bg-fitness-orange/90"
            >
              Salvar
            </Button>
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => setIsEditingPix(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-fitness-dark rounded-md">
          {savedPixKey ? (
            <div>
              <p className="text-xs text-gray-400 mb-1">
                {savedPixKeyType === 'cpf' ? 'CPF' : 
                 savedPixKeyType === 'cnpj' ? 'CNPJ' : 
                 savedPixKeyType === 'email' ? 'Email' : 
                 savedPixKeyType === 'phone' ? 'Telefone' : 'Chave Aleatória'}
              </p>
              <p className="font-medium">{savedPixKey}</p>
            </div>
          ) : (
            <p className="text-gray-400">Nenhuma chave PIX cadastrada</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PixKeySection;
