import { supabase } from '../supabase-client.js';

export const authService = {
    /**
     * Log in with Email and Password
     */
    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error('Login failed:', error.message);
            return { success: false, error: error.message };
        }

        return { success: true, user: data.user };
    },

    /**
     * Log out
     */
    async signOut() {
        const { error } = await supabase.auth.signOut();
        return !error;
    },

    /**
     * Get current session/user
     */
    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    }
};
