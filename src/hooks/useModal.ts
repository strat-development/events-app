import { create } from 'zustand';

type ModalStore = {
    isOpen: boolean;
    showSignUp: boolean;
    onOpen: (showSignUp?: boolean) => void;
    onClose: () => void;
    setShowSignUp: (showSignUp: boolean) => void;
}

export const useModal = create<ModalStore>((set) => ({
    isOpen: false,
    showSignUp: false,
    onOpen: (showSignUp = false) => set({ isOpen: true, showSignUp }),
    onClose: () => set({ isOpen: false, showSignUp: false }),
    setShowSignUp: (showSignUp) => set({ showSignUp }),
}));