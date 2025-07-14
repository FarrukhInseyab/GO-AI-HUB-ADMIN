import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';
import Dialog from '../ui/Dialog';
import Button from '../ui/Button';
import TextArea from '../ui/TextArea';

interface InitiateContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comments: string) => void;
}

const InitiateContactDialog: React.FC<InitiateContactDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [comments, setComments] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(comments);
    setComments('');
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={t('businessInterest.initiateContact')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg mb-4 border border-teal-100">
          <div className="flex items-center mb-2">
            <MessageSquare className="h-5 w-5 text-teal-600 mr-2 flex-shrink-0" />
            <h3 className="font-medium text-teal-800">Contact Initiation</h3>
          </div>
          <p className="text-sm text-teal-700">
            You are about to initiate contact with this lead. Please provide details about the next steps or any relevant comments.
          </p>
        </div>
        
        <TextArea
          label={t('businessInterest.nextStepsComments')}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder={t('businessInterest.nextStepsPlaceholder')}
          rows={4}
          required
        />
        
        <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2 rtl:space-x-reverse pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!comments.trim()}
            className="w-full sm:w-auto"
          >
            {t('common.confirm')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

export default InitiateContactDialog;