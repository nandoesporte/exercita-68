
import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, HelpCircle, Mail, MessageSquare, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface FAQ {
  question: string;
  answer: string;
  isOpen: boolean;
}

const HelpCenter = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      question: 'Como cancelar minha assinatura?',
      answer: 'Para cancelar sua assinatura, acesse seu perfil, vá em "Configurações" e selecione "Gerenciar Assinatura". Lá você encontrará a opção de cancelar. O cancelamento será efetivo ao final do período já pago.',
      isOpen: false,
    },
    {
      question: 'Como personalizar meu plano de treino?',
      answer: 'Você pode personalizar seu plano de treino acessando a seção "Treinos" e selecionando "Personalizar". Lá você pode ajustar intensidade, duração e focar em áreas específicas do corpo.',
      isOpen: false,
    },
    {
      question: 'Os treinos funcionam offline?',
      answer: 'Sim! Uma vez que você baixe os treinos, eles ficam disponíveis offline. Para baixar, toque no ícone de download na página do treino.',
      isOpen: false,
    },
    {
      question: 'Como restaurar compras anteriores?',
      answer: 'Para restaurar compras anteriores, vá até "Configurações > Assinatura > Restaurar Compras". Você precisará estar logado com a mesma conta usada para fazer a compra original.',
      isOpen: false,
    },
    {
      question: 'Como conectar dispositivos de monitoramento?',
      answer: 'Acesse "Configurações > Conectar Dispositivos" e siga as instruções para parear seu dispositivo via Bluetooth ou através da conta do fabricante.',
      isOpen: false,
    },
  ]);

  const [message, setMessage] = useState('');

  const toggleFAQ = (index: number) => {
    setFaqs(
      faqs.map((faq, i) => {
        if (i === index) {
          return { ...faq, isOpen: !faq.isOpen };
        }
        return faq;
      })
    );
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error('Por favor, digite sua mensagem');
      return;
    }
    
    // In a real app, this would make an API call to send the message
    toast.success('Mensagem enviada! Responderemos em breve.');
    setMessage('');
  };

  return (
    <main className="container">
      <section className="mobile-section">
        <div className="mb-6 flex items-center">
          <Link to="/profile" className="mr-2">
            <ArrowLeft className="text-fitness-orange" />
          </Link>
          <h1 className="text-2xl font-bold">Central de Ajuda</h1>
        </div>
        
        <div className="space-y-6">
          {/* FAQ Section */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold mb-4">Perguntas Frequentes</h2>
            
            {faqs.map((faq, index) => (
              <div key={index} className="bg-fitness-darkGray rounded-lg overflow-hidden">
                <button
                  className="flex justify-between items-center w-full p-4 text-left"
                  onClick={() => toggleFAQ(index)}
                >
                  <span className="font-medium">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      faq.isOpen ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                
                {faq.isOpen && (
                  <div className="p-4 pt-0 text-sm text-gray-300 border-t border-gray-700">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Contact Section */}
          <div className="bg-fitness-darkGray p-4 rounded-lg space-y-4">
            <h2 className="text-lg font-semibold">Contato</h2>
            
            <div className="flex items-center space-x-3 p-3 bg-fitness-dark rounded">
              <Mail className="h-5 w-5 text-fitness-orange" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-gray-400">suporte@fitnessapp.com</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-fitness-dark rounded">
              <Phone className="h-5 w-5 text-fitness-orange" />
              <div>
                <p className="font-medium">Telefone</p>
                <p className="text-sm text-gray-400">(11) 99999-9999</p>
                <p className="text-xs text-gray-500">Seg-Sex: 9h às 18h</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-fitness-dark rounded">
              <MessageSquare className="h-5 w-5 text-fitness-orange" />
              <div>
                <p className="font-medium">Chat</p>
                <p className="text-sm text-gray-400">Disponível 24/7</p>
              </div>
            </div>
          </div>
          
          {/* Message Form */}
          <div className="bg-fitness-darkGray p-4 rounded-lg">
            <div className="flex items-center mb-4">
              <HelpCircle className="h-5 w-5 text-fitness-orange mr-2" />
              <h2 className="text-lg font-semibold">Envie sua dúvida</h2>
            </div>
            
            <form onSubmit={handleSendMessage} className="space-y-4">
              <textarea
                className="w-full bg-fitness-dark text-white border border-gray-700 rounded-lg p-3 min-h-[120px]"
                placeholder="Digite sua mensagem aqui..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              
              <Button type="submit" className="w-full bg-fitness-orange hover:bg-fitness-orange/90">
                Enviar Mensagem
              </Button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HelpCenter;
