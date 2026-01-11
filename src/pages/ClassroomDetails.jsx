import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Plus, ArrowLeft, Calendar, BookOpen } from "lucide-react";
import { useSchool } from "../context/SchoolContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function ClassroomDetails() {
  const { id } = useParams();
  const { getClassDetails, teachers, classCourses, refreshData } = useSchool();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassData();
  }, [id]);

  const loadClassData = async () => {
    setLoading(true);
    try {
      const data = await getClassDetails(id);
      setClassData(data);
      if (data && data.students && data.students.length > 0) {
        // Set first class course as default selected subject
        const firstClassCourse = classCourses.find(cc => cc.classroom?.id === parseInt(id));
        if (firstClassCourse) {
          setSelectedSubject(firstClassCourse.id);
        }
      }
    } catch (err) {
      console.error("Error loading class details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Loading class details...</p>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100 mt-8">
        <p className="text-gray-500 mb-4">Class not found or data missing.</p>
        <Link to="/classrooms" className="text-brand-electric font-medium hover:underline">
          Go back to Classrooms
        </Link>
      </div>
    );
  }

  const teacher = teachers.find(t => t.id === classData.homeroomTeacherId);
  const totalStudents = classData.students?.length || 0;
  const classCoursesForClass = classCourses.filter(cc => cc.classroom?.id === parseInt(id));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <Link to="/classrooms" className="text-sm text-brand-muted hover:text-brand-electric flex items-center gap-1 mb-2">
            <ArrowLeft size={14} /> Înapoi la clase
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-brand-text">Clasa {classData.name}</h1>
            <span className="px-3 py-1 bg-brand-electric/10 text-brand-electric rounded-full text-sm font-bold">General</span>
          </div>
          <p className="text-brand-muted flex items-center gap-2">
            <User size={18} /> Diriginte: <span className="font-semibold text-brand-text">
              {teacher ? `${teacher.firstName} ${teacher.lastName}` : "Not assigned"}
            </span>
          </p>
        </div>
        <Button><Plus size={18} /> Add Grade</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 overflow-x-auto">
        {["overview", "students", "grades", "absences"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 text-sm font-medium capitalize transition-all relative whitespace-nowrap ${
              activeTab === tab ? "text-brand-electric" : "text-brand-muted hover:text-brand-text"
            }`}
          >
            {tab === "overview" ? "Sumar" : tab === "students" ? "Elevi" : tab === "grades" ? "Catalog Note" : "Catalog Absențe"}
            {activeTab === tab && (
              <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-electric" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {/* Tab Sumar */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-blue-50 border-blue-100">
              <h3 className="text-blue-900 font-bold mb-1">Total Elevi</h3>
              <p className="text-3xl font-bold text-brand-electric">{totalStudents}</p>
            </Card>
            <Card className="bg-green-50 border-green-100">
              <h3 className="text-green-900 font-bold mb-1">Materii</h3>
              <p className="text-3xl font-bold text-green-600">{classCoursesForClass.length}</p>
            </Card>
            <Card className="bg-orange-50 border-orange-100">
              <h3 className="text-orange-900 font-bold mb-1">Status</h3>
              <p className="text-3xl font-bold text-orange-600">Active</p>
            </Card>
          </div>
        )}

        {/* Tab Elevi */}
        {activeTab === "students" && (
          <Card>
            <div className="flex justify-between mb-6">
              <h3 className="font-bold text-lg">Listă Elevi</h3>
            </div>
            <div className="space-y-1">
              {classData.students && classData.students.length > 0 ? (
                classData.students.map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-electric/10 text-brand-electric flex items-center justify-center font-bold text-xs">
                        {i + 1}
                      </div>
                      <div>
                        <span className="font-medium text-brand-text block">{s.firstName} {s.lastName}</span>
                        <span className="text-xs text-gray-400">{s.registrationCode || "—"}</span>
                      </div>
                    </div>
                    <Button variant="ghost" className="text-xs">Vezi Profil</Button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No students in this class
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Tab Catalog Note */}
        {activeTab === "grades" && (
          <Card className="border-t-4 border-t-brand-electric shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b-2 border-gray-200 gap-4 bg-white/50 p-4 rounded-t-lg">
              <div className="flex items-center gap-2">
                <BookOpen className="text-brand-electric" />
                <h3 className="font-bold text-xl text-gray-900">Situație Note</h3>
              </div>

              <div className="flex items-center gap-2 bg-white p-1 rounded-lg border-2 border-gray-300 shadow-sm">
                <span className="text-xs font-bold text-gray-600 uppercase px-2">Materie:</span>
                <select
                  className="bg-transparent text-gray-900 text-sm font-bold focus:outline-none cursor-pointer"
                  value={selectedSubject || ""}
                  onChange={(e) => setSelectedSubject(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Select a course</option>
                  {classCoursesForClass.map((cc) => (
                    <option key={cc.id} value={cc.id}>
                      {cc.course?.name || "Course"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto p-2">
              {selectedSubject ? (
                <div className="p-8 text-center text-gray-500">
                  <p>Catalog API integration pending. This will show grades when the catalog API is ready.</p>
                  <p className="text-sm mt-2">Selected course: {classCoursesForClass.find(cc => cc.id === selectedSubject)?.course?.name}</p>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Please select a course to view grades
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Tab Catalog Absențe */}
        {activeTab === "absences" && (
          <Card className="border-t-4 border-t-red-500 shadow-xl">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b-2 border-gray-200 bg-white/50 p-4 rounded-t-lg">
              <Calendar className="text-red-600" />
              <h3 className="font-bold text-xl text-gray-900">Registru Absențe</h3>
            </div>

            <div className="overflow-x-auto p-2">
              <div className="p-8 text-center text-gray-500">
                <p>Absences API integration pending. This will show absences when the API is ready.</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
