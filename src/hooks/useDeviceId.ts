import { useState, useEffect } from 'react';

const DEVICE_ID_KEY = 'expense_tracker_device_id';

function generateDeviceId(): string {
  return 'device_' + crypto.randomUUID();
}

export function useDeviceId(): string {
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    let storedId = localStorage.getItem(DEVICE_ID_KEY);
    if (!storedId) {
      storedId = generateDeviceId();
      localStorage.setItem(DEVICE_ID_KEY, storedId);
    }
    setDeviceId(storedId);
  }, []);

  return deviceId;
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let storedId = localStorage.getItem(DEVICE_ID_KEY);
  if (!storedId) {
    storedId = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, storedId);
  }
  return storedId;
}
