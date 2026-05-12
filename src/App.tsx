import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
  useAuth,
} from "@clerk/react";
import { useEffect } from "react";

function App() {
  const { user, isLoaded } = useUser();
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    async function showUserData() {
      if (!isLoaded) return;

      console.log("USER COMPLETO:", user);

      if (!user || !isSignedIn) {
        console.log("No hay usuario logueado");
        return;
      }

      const token = await getToken();

      console.log("TOKEN:", token);

      console.log("ID:", user.id);
      console.log("Email:", user.primaryEmailAddress?.emailAddress);
      console.log("Nombre:", user.firstName);
      console.log("Apellido:", user.lastName);
      console.log("Imagen:", user.imageUrl);
    }

    showUserData();
  }, [user, isLoaded, isSignedIn, getToken]);

  return (
    <div>
      <h1>Mi app</h1>

      <Show when="signed-out">
        <SignInButton mode="modal" />
        <SignUpButton mode="modal" />
      </Show>

      <Show when="signed-in">
        <p>Bienvenido</p>
        <UserButton />
      </Show>
    </div>
  );
}

export default App;