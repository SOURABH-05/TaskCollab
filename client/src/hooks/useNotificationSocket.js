import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import { toast } from 'react-toastify';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const useNotificationSocket = () => {
    const { user } = useSelector((state) => state.auth);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        // Create a separate socket connection for notifications
        // In a production app, you might want to multiplex this over a single connection
        // but for simplicity and separation of concerns, a new connection is fine for now.
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
        });

        socketRef.current.on('connect', () => {
            console.log('Notification socket connected');
            socketRef.current.emit('joinUserRoom', user._id || user.id);
        });

        socketRef.current.on('notification', (data) => {
            console.log('Notification received:', data);
            // Play a sound if you want, or just show toast
            toast.info(data.message, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [user]);
};
