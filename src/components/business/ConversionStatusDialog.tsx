import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, MessageSquare } from 'lucide-react';
import Dialog from '../ui/Dialog';
import Button from '../ui/Button';
import TextArea from '../ui/TextArea';

interface ConversionStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: string, comments: string) => void;
  interestId: string;
  companyName: string;
  solutionName: string;
}

const ConversionStatusDialog: React.FC<ConversionStatusDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  interestId,
  companyName,
  solutionName,
}) => {
  const { t } = useTranslation();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [comments, setComments] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStatus && comments.trim()) {
      onConfirm(selectedStatus, comments);
      setSelectedStatus('');
      setComments('');
    }
  };

  const handleClose = () => {
    setSelectedStatus('');
    setComments('');
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Update Lead Conversion Status"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg mb-4 border border-teal-100">
          <div className="flex items-center mb-2">
            <MessageSquare className="h-5 w-5 text-teal-600 mr-2 flex-shrink-0" />
            <h3 className="font-medium text-teal-800">Lead Conversion Update</h3>
          </div>
          <p className="text-sm text-teal-700 mb-2">
            <strong>Company:</strong> {companyName}
          </p>
          <p className="text-sm text-teal-700">
            <strong>Solution:</strong> {solutionName}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Conversion Status
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 cursor-pointer transition-all duration-200">
                <input
                  type="radio"
                  name="conversionStatus"
                  value="Lead Converted to Sales"
                  checked={selectedStatus === 'Lead Converted to Sales'}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <div className="ml-3 flex items-center">
                  <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Lead Converted to Sales</div>
                    <div className="text-xs text-gray-500">Successfully converted to a paying customer</div>
                  </div>
                </div>
              </label>

              <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 cursor-pointer transition-all duration-200">
                <input
                  type="radio"
                  name="conversionStatus"
                  value="Lead Not Converted to Sales"
                  checked={selectedStatus === 'Lead Not Converted to Sales'}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                />
                <div className="ml-3 flex items-center">
                  <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Lead Not Converted to Sales</div>
                    <div className="text-xs text-gray-500">Lead did not result in a sale</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <TextArea
            label="Conversion Details & Comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder={
              selectedStatus === 'Lead Converted to Sales'
                ? "Provide details about the successful conversion: deal size, timeline, key factors that led to success, next steps, etc."
                : selectedStatus === 'Lead Not Converted to Sales'
                ? "Explain why the lead didn't convert: reasons for rejection, competitor chosen, budget constraints, timing issues, feedback for improvement, etc."
                : "Provide detailed comments about the conversion status and any relevant information..."
            }
            rows={5}
            required
          />
        </div>
        
        <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 rtl:space-x-reverse pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!selectedStatus || !comments.trim()}
            className="w-full sm:w-auto"
          >
            Update Conversion Status
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

export default ConversionStatusDialog;