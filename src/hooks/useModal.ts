import { create } from 'zustand';

type ModalStore = {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
}

export const useModal = create<ModalStore>((set) => ({
    isOpen: false,
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false }),
}));