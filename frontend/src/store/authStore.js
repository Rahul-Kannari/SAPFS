import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,
      
      studentProfile: null,
      
      login: (userData, token, refreshToken, studentProfile) => {
        localStorage.setItem('access_token', token);
        localStorage.setItem('refresh_token', refreshToken);
        const mergedUser = { ...userData, ...(studentProfile || {}) };
        if (studentProfile) {
          localStorage.setItem('student_profile', JSON.stringify(studentProfile));
        }
        set({
          user: mergedUser,
          token,
          role: userData.role,
          isAuthenticated: true,
          studentProfile: studentProfile || null,
        });
      },
      
      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, token: null, role: null, isAuthenticated: false });
      },
      
      updateUser: (userData) => set((state) => ({ user: { ...state.user, ...userData } })),
    }),
    { name: 'auth-storage', partialize: (state) => ({ user: state.user, role: state.role, isAuthenticated: state.isAuthenticated }) }
  )
);
