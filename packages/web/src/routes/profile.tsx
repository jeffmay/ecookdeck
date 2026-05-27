// import { useOutletContext, useNavigate } from "react-router";
// import { ProfileSettingsPage } from "../pages/ProfileSettingsPage.tsx";
// import type { RootContext } from "../root.tsx";

// export default function Profile() {
//   const { bookId, onRename } = useOutletContext<RootContext>();
//   const navigate = useNavigate();

//   return (
//     <ProfileSettingsPage
//       currentName={userName}
//       onSave={(name) => {
//         onRename(name);
//         navigate("/dashboard");
//       }}
//       onCancel={() => navigate("/dashboard")}
//     />
//   );
// }
