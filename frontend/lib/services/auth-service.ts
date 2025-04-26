/**
 * Authentication Service for Authentico
 *
 * This service provides methods for user authentication, including login,
 * registration, and logout.
 */

import { IApiClient } from '../api/api-interfaces';
import {
  ValidationError,
  AuthenticationError as AuthError,
} from '../api/error-types';
import { validateEmail, validatePassword } from '../validation-util';

/**
 * User data interface
 */
export interface IUser {
  id: string;
  name: string;
  email: string;
  role: string;
  walletAddress?: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Authentication service interface
 */
export interface IAuthService {
  /**
   * Log in a user with email and password
   * @param email User email
   * @param password User password
   * @returns Promise with the user data
   */
  loginWithEmailPassword(email: string, password: string): Promise<IUser>;

  /**
   * Register a new user
   * @param name User name
   * @param email User email
   * @param password User password
   * @returns Promise with the user data
   */
  registerWithEmailPassword(
    name: string,
    email: string,
    password: string
  ): Promise<IUser>;

  /**
   * Log in a user with a wallet
   * @param walletAddress User wallet address
   * @returns Promise with the user data
   */
  loginWithWallet(walletAddress: string): Promise<IUser>;

  /**
   * Log out the current user
   * @returns Promise that resolves when the user is logged out
   */
  logout(): Promise<void>;

  /**
   * Get the current user
   * @returns Promise with the user data or null if not authenticated
   */
  getCurrentUser(): Promise<IUser | null>;

  /**
   * Update the user profile
   * @param userData User data to update
   * @returns Promise with the updated user data
   */
  updateProfile(userData: Partial<IUser>): Promise<IUser>;

  /**
   * Connect a wallet to the user account
   * @param walletAddress Wallet address to connect
   * @returns Promise with the updated user data
   */
  connectWallet(walletAddress: string): Promise<IUser>;

  /**
   * Disconnect a wallet from the user account
   * @returns Promise with the updated user data
   */
  disconnectWallet(): Promise<IUser>;
}

/**
 * Authentication service implementation
 */
export class AuthService implements IAuthService {
  private apiClient: IApiClient;
  private firebaseAuth: any;

  /**
   * Create a new authentication service
   * @param apiClient API client to use for making requests
   * @param firebaseAuth Firebase auth instance
   */
  constructor(apiClient: IApiClient, firebaseAuth: any) {
    this.apiClient = apiClient;
    this.firebaseAuth = firebaseAuth;
  }

  /**
   * Log in a user with email and password
   * @param email User email
   * @param password User password
   * @returns Promise with the user data
   * @throws {ValidationError} If the email or password is invalid
   * @throws {AuthError} If the login fails
   */
  async loginWithEmailPassword(
    email: string,
    password: string
  ): Promise<IUser> {
    // Validate email and password
    if (!validateEmail(email)) {
      throw new ValidationError('Invalid email address');
    }

    if (!validatePassword(password)) {
      throw new ValidationError('Invalid password format');
    }

    try {
      // Sign in with Firebase
      const userCredential = await this.firebaseAuth.signInWithEmailAndPassword(
        email,
        password
      );

      // Get the ID token
      const idToken = await userCredential.user.getIdToken();

      // Call the API to log in
      const response = await this.apiClient.post('/auth/login', {
        email,
        idToken,
      });

      return response.user;
    } catch (error: any) {
      // Handle Firebase errors
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        throw new AuthError('Invalid email or password');
      }

      // Handle other errors
      throw error;
    }
  }

  /**
   * Register a new user
   * @param name User name
   * @param email User email
   * @param password User password
   * @returns Promise with the user data
   * @throws {ValidationError} If the name, email, or password is invalid
   * @throws {AuthError} If the registration fails
   */
  async registerWithEmailPassword(
    name: string,
    email: string,
    password: string
  ): Promise<IUser> {
    // Validate name, email, and password
    if (!name || name.trim() === '') {
      throw new ValidationError('Name is required');
    }

    if (!validateEmail(email)) {
      throw new ValidationError('Invalid email address');
    }

    if (!validatePassword(password)) {
      throw new ValidationError('Invalid password format');
    }

    try {
      // Create user with Firebase
      const userCredential =
        await this.firebaseAuth.createUserWithEmailAndPassword(email, password);

      // Get the ID token
      const idToken = await userCredential.user.getIdToken();

      // Call the API to register
      const response = await this.apiClient.post('/auth/register', {
        name,
        email,
        idToken,
      });

      return response.user;
    } catch (error: any) {
      // Handle Firebase errors
      if (error.code === 'auth/email-already-in-use') {
        throw new AuthError('Email already in use');
      }

      // Handle other errors
      throw error;
    }
  }

  /**
   * Log in a user with a wallet
   * @param walletAddress User wallet address
   * @returns Promise with the user data
   * @throws {ValidationError} If the wallet address is invalid
   * @throws {AuthError} If the login fails
   */
  async loginWithWallet(walletAddress: string): Promise<IUser> {
    // Validate wallet address
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      throw new ValidationError('Invalid wallet address');
    }

    try {
      // Call the API to log in with wallet
      const response = await this.apiClient.post('/auth/wallet-login', {
        walletAddress,
      });

      return response.user;
    } catch (error) {
      // Handle errors
      throw error;
    }
  }

  /**
   * Log out the current user
   * @returns Promise that resolves when the user is logged out
   */
  async logout(): Promise<void> {
    try {
      // Sign out from Firebase
      await this.firebaseAuth.signOut();

      // Call the API to log out
      await this.apiClient.post('/auth/logout');
    } catch (error) {
      // Handle errors
      throw error;
    }
  }

  /**
   * Get the current user
   * @returns Promise with the user data or null if not authenticated
   */
  async getCurrentUser(): Promise<IUser | null> {
    try {
      // Check if there is a current user in Firebase
      const currentUser = this.firebaseAuth.currentUser;

      if (!currentUser) {
        return null;
      }

      // Call the API to get the user data
      const response = await this.apiClient.get('/auth/me');

      return response.user;
    } catch (error) {
      // Handle errors
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Update the user profile
   * @param userData User data to update
   * @returns Promise with the updated user data
   */
  async updateProfile(userData: Partial<IUser>): Promise<IUser> {
    try {
      // Call the API to update the profile
      const response = await this.apiClient.put('/auth/profile', userData);

      return response.user;
    } catch (error) {
      // Handle errors
      throw error;
    }
  }

  /**
   * Connect a wallet to the user account
   * @param walletAddress Wallet address to connect
   * @returns Promise with the updated user data
   * @throws {ValidationError} If the wallet address is invalid
   */
  async connectWallet(walletAddress: string): Promise<IUser> {
    // Validate wallet address
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      throw new ValidationError('Invalid wallet address');
    }

    try {
      // Call the API to connect the wallet
      const response = await this.apiClient.post('/auth/connect-wallet', {
        walletAddress,
      });

      return response.user;
    } catch (error) {
      // Handle errors
      throw error;
    }
  }

  /**
   * Disconnect a wallet from the user account
   * @returns Promise with the updated user data
   */
  async disconnectWallet(): Promise<IUser> {
    try {
      // Call the API to disconnect the wallet
      const response = await this.apiClient.post('/auth/disconnect-wallet');

      return response.user;
    } catch (error) {
      // Handle errors
      throw error;
    }
  }
}
