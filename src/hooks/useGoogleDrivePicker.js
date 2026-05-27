import { useGoogleLogin } from "@react-oauth/google";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

export function useGoogleDrivePicker(onFilesPicked) {

  const loadPicker = (accessToken) => {
    window.gapi.load("picker", () => {
      const view = new window.google.picker.DocsView()
        .setIncludeFolders(false)

      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
        .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
        .setOAuthToken(accessToken)
        .setDeveloperKey(API_KEY)
        .setCallback((data) => {
          if (data.action === window.google.picker.Action.PICKED) {
            onFilesPicked(data.docs, accessToken);
          }
        })
        .build();

      picker.setVisible(true);
    });
  };

  const login = useGoogleLogin({
    scope: DRIVE_SCOPE,
    flow: "implicit",
    
    onSuccess: (tokenResponse) => {
      const expiry = Date.now() + tokenResponse.expires_in * 1000;

      localStorage.setItem("drive_token", tokenResponse.access_token);
      localStorage.setItem("drive_token_expiry", expiry);

      loadPicker(tokenResponse.access_token);
    },

    onError: (err) => {
      console.error("Drive auth failed", err);
    },
  });

  const openDrive = () => {
    const token = localStorage.getItem("drive_token");
    const expiry = localStorage.getItem("drive_token_expiry");

    if (token && expiry && Date.now() < expiry) {
      loadPicker(token);
    } else {
      login();
    }
  };

  return openDrive;
}
