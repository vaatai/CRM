'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';

interface DeleteContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  contactName: string;
}

export function DeleteContactDialog({
  open,
  onOpenChange,
  onConfirm,
  contactName,
}: DeleteContactDialogProps) {
  const [loading, setLoading] = React.useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Delete Contact</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete &quot;{contactName}&quot;? This action cannot be undone.
          All associated notes and activities will also be removed.
        </DialogDescription>
      </DialogHeader>
      <DialogContent />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
