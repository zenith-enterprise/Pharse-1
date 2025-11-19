import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';

const InvestorFormModal = ({ open, onClose, investor, onSuccess }) => {
  const isEditMode = !!investor;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    pan: '',
    risk_profile: 'Moderate',
    investor_type: 'Individual'
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (investor) {
      setFormData({
        name: investor.name || '',
        email: investor.email || '',
        mobile: investor.mobile || '',
        pan: investor.pan || '',
        risk_profile: investor.risk_profile || 'Moderate',
        investor_type: investor.investor_type || 'Individual'
      });
    } else {
      setFormData({
        name: '',
        email: '',
        mobile: '',
        pan: '',
        risk_profile: 'Moderate',
        investor_type: 'Individual'
      });
    }
  }, [investor, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!formData.mobile.trim()) {
      toast.error('Mobile is required');
      return false;
    }
    if (!formData.pan.trim()) {
      toast.error('PAN is required');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Invalid email format');
      return false;
    }
    
    // Basic mobile validation (10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(formData.mobile)) {
      toast.error('Mobile must be 10 digits');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isEditMode) {
        // Update investor
        const response = await axios.put(`/investors/${investor.investor_id}`, formData);
        if (response.data.success) {
          toast.success('Investor updated successfully');
          onSuccess();
          onClose();
        }
      } else {
        // Create investor
        const response = await axios.post('/investors', formData);
        if (response.data.success) {
          toast.success('Investor created successfully');
          onSuccess();
          onClose();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${isEditMode ? 'update' : 'create'} investor`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isEditMode ? 'Edit Investor' : 'Add New Investor'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="investor@example.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Mobile */}
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number *</Label>
            <Input
              id="mobile"
              placeholder="9876543210"
              value={formData.mobile}
              onChange={(e) => handleChange('mobile', e.target.value)}
              maxLength={10}
              disabled={loading}
            />
          </div>

          {/* PAN */}
          <div className="space-y-2">
            <Label htmlFor="pan">PAN *</Label>
            <Input
              id="pan"
              placeholder="ABCDE1234F"
              value={formData.pan}
              onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
              maxLength={10}
              disabled={loading}
            />
          </div>

          {/* Risk Profile */}
          <div className="space-y-2">
            <Label htmlFor="risk_profile">Risk Profile *</Label>
            <Select
              value={formData.risk_profile}
              onValueChange={(value) => handleChange('risk_profile', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select risk profile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Moderate">Moderate</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Investor Type */}
          <div className="space-y-2">
            <Label htmlFor="investor_type">Investor Type *</Label>
            <Select
              value={formData.investor_type}
              onValueChange={(value) => handleChange('investor_type', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select investor type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Individual">Individual</SelectItem>
                <SelectItem value="Family">Family</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-blue-900 hover:bg-blue-800">
            {loading ? 'Saving...' : (isEditMode ? 'Update Investor' : 'Create Investor')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvestorFormModal;
