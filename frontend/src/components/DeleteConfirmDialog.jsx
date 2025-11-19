import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const DeleteConfirmDialog = ({ open, onClose, investor, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await axios.delete(`/investors/${investor.investor_id}`);
      if (response.data.success) {
        toast.success('Investor deleted successfully');
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete investor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-bold">Delete Investor</DialogTitle>
          </div>
          <DialogDescription className="text-slate-600 pt-2">
            Are you sure you want to delete <span className="font-semibold">{investor?.name}</span>?
            <br /><br />
            This action will permanently remove:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Investor profile and details</li>
              <li>All portfolios and transactions</li>
              <li>AI analysis history</li>
            </ul>
            <br />
            <span className="text-red-600 font-semibold">This action cannot be undone.</span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? 'Deleting...' : 'Delete Investor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
