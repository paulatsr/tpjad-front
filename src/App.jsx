import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SchoolProvider, useSchool } from "./context/SchoolContext";
import Layout from "./layout/Layout";
import Login from "./pages/Login";

// Importăm paginile REALE
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import ClassroomsList from "./pages/ClassroomsList";
import Courses from "./pages/Courses";
import ClassroomDetails from "./pages/ClassroomDetails";
import Teachers from "./pages/Teachers";
import Parents from "./pages/Parents";
import Grades from "./pages/Grades";
import MyClassroom from "./pages/MyClassroom";

function ProtectedApp() {
  const schoolContext = useSchool();
  const user = schoolContext?.user;

  // Dacă nu ești logat, te trimite la Login
  if (!user) return <Login />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        
        {/* Rutele către paginile reale */}
        <Route path="/students" element={<Students />} />
        <Route path="/classrooms" element={<ClassroomsList />} />
        <Route path="/classrooms/:id" element={<ClassroomDetails />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/parents" element={<Parents />} />
        <Route path="/grades" element={<Grades />} />
        <Route path="/my-classroom" element={<MyClassroom />} />
        
        {/* Orice altceva duce la Dashboard */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SchoolProvider>
        <BrowserRouter>
          <ProtectedApp />
        </BrowserRouter>
      </SchoolProvider>
    </AuthProvider>
  );
}
