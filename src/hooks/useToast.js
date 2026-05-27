import { useCallback, useState } from "react";

export default function useToast(defaultDuration = 3000) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback(
    (message, options = {}) => {
      setToast({
        id: Date.now(),
        message,
        type: options.type || "success",
        title: options.title,
        duration: options.duration || defaultDuration,
      });
    },
    [defaultDuration]
  );

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, hideToast };
}
