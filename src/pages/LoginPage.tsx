import React, { useEffect, useRef } from 'react';
import firebase from '../firebaseConfig';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import { useLanguage } from '../contexts/LanguageContext';

export const LoginPage: React.FC = () => {
    const { isRTL } = useLanguage();
    const uiRef = useRef<HTMLDivElement>(null);
    const uiInstance = useRef<firebaseui.auth.AuthUI | null>(null);

    useEffect(() => {
        // FirebaseUI config
        const uiConfig: firebaseui.auth.Config = {
            signInSuccessUrl: '/',
            signInOptions: [
                {
                    provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
                    requireDisplayName: true,
                },
                // Google Sign-in
                firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            ],
            signInFlow: 'popup',
            callbacks: {
                signInSuccessWithAuthResult: () => {
                    // Return false to prevent redirect
                    return false;
                },
            },
        };

        // Initialize or get existing AuthUI instance
        if (!uiInstance.current) {
            uiInstance.current = firebaseui.auth.AuthUI.getInstance() ||
                new firebaseui.auth.AuthUI(firebase.auth());
        }

        // Start FirebaseUI
        if (uiRef.current) {
            uiInstance.current.start(uiRef.current, uiConfig);
        }

        // Cleanup
        return () => {
            if (uiInstance.current) {
                uiInstance.current.reset();
            }
        };
    }, []);

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgb(var(--color-bg-primary))' }}
        >
            <div
                className="w-full max-w-md rounded-2xl p-8 shadow-2xl border"
                style={{
                    backgroundColor: 'rgb(var(--color-bg-card))',
                    borderColor: 'rgb(var(--color-border))'
                }}
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <div
                        className="inline-flex items-center justify-center h-16 w-16 rounded-xl mb-4"
                        style={{ backgroundColor: 'rgb(var(--color-brand-primary))' }}
                    >
                        <div
                            className="flex h-14 w-14 items-center justify-center rounded-lg text-2xl font-bold"
                            style={{
                                backgroundColor: 'rgb(var(--color-bg-card))',
                                color: 'rgb(var(--color-text-primary))'
                            }}
                        >
                            RC
                        </div>
                    </div>
                    <h1
                        className="text-2xl font-bold mb-2"
                        style={{ color: 'rgb(var(--color-brand-primary))' }}
                    >
                        RetailCore
                    </h1>
                    <p
                        className="text-sm"
                        style={{ color: 'rgb(var(--color-text-secondary))' }}
                    >
                        {isRTL ? 'اپنے اکاؤنٹ میں سائن ان کریں' : 'Sign in to your account'}
                    </p>
                </div>

                {/* FirebaseUI Container */}
                <div
                    ref={uiRef}
                    id="firebaseui-auth-container"
                    className="firebaseui-container-themed"
                />

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p
                        className="text-xs"
                        style={{ color: 'rgb(var(--color-text-secondary))' }}
                    >
                        {isRTL
                            ? 'آف لائن فرسٹ POS - پاکستان کی مقامی مارکیٹوں کے لیے'
                            : 'Offline-first POS for Pakistan\'s local markets'}
                    </p>
                </div>
            </div>

            {/* Custom styles for FirebaseUI to match theme */}
            <style>{`
        .firebaseui-container-themed .firebaseui-card-content {
          padding: 0;
        }
        .firebaseui-container-themed .firebaseui-card-header {
          display: none;
        }
        .firebaseui-container-themed .mdl-button--raised.mdl-button--colored {
          background-color: rgb(var(--color-brand-primary)) !important;
        }
        .firebaseui-container-themed .firebaseui-textfield.mdl-textfield .firebaseui-label::after {
          background-color: rgb(var(--color-brand-primary)) !important;
        }
        .firebaseui-container-themed .mdl-progress > .progressbar {
          background-color: rgb(var(--color-brand-primary)) !important;
        }
        .firebaseui-container-themed .firebaseui-idp-button {
          border-radius: 8px !important;
        }
        .firebaseui-container-themed .firebaseui-form-actions {
          padding: 1rem 0 0 0;
        }
      `}</style>
        </div>
    );
};

export default LoginPage;
