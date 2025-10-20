import { login as dbLogin } from '@/lib/db';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as React from "react";


type AuthContextType = {
    userId: number | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    isLoading: boolean;
}


const AuthContext = React.createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: React.PropsWithChildren<object>) {
    const [userId, setUserId] = React.useState<number | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);


    const loadFromStorage = async () => {
        try {
            const storedUserId = await AsyncStorage.getItem("userId");
            if (storedUserId) {
                setUserId(Number(storedUserId));
            }
        } catch (error) {
            console.error("Failed to load user ID from storage:", error);
        } finally {
            setIsLoading(false);
        }
    }

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const result = await dbLogin(username, password);
            // const result = {
            //     success: true,
            //     user: { id: 1 },
            // }

            if (result.success && result.user) {
                await AsyncStorage.setItem('userId', result.user.id.toString());
                setUserId(result.user.id);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await AsyncStorage.removeItem('user');
            setUserId(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };


    React.useEffect(() => {
        loadFromStorage();
    }, []);

    const value: AuthContextType = {
        userId,
        login,
        logout,
        isLoading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}


export function useAuth(): AuthContextType {
    const context = React.useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}