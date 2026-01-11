// Script to add test data for demo accounts (teacher, student, admin)
// Run this in browser console after logging in as admin

const API_BASE_URL = 'http://localhost:8080';
const getToken = () => localStorage.getItem('token');

const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Request failed');
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/plain')) {
    return await response.text();
  }
  return await response.json();
};

async function addDemoTestData() {
  try {
    console.log('Starting to add demo test data...');

    // Get existing data
    const students = await apiRequest('/students');
    const teachers = await apiRequest('/teachers');
    const classrooms = await apiRequest('/classrooms');
    const courses = await apiRequest('/courses');
    const users = await apiRequest('/users');

    // Find demo accounts
    const teacherUser = users.find(u => u.username === 'teacher');
    const studentUser = users.find(u => u.username === 'student');

    if (!teacherUser || !studentUser) {
      console.error('Demo accounts (teacher/student) not found!');
      return;
    }

    const teacher = teachers.find(t => t.user?.username === 'teacher');
    const student = students.find(s => s.user?.username === 'student');

    if (!teacher || !student) {
      console.error('Teacher or Student entity not found!');
      return;
    }

    console.log('Found teacher:', teacher);
    console.log('Found student:', student);

    // 1. Create or find classrooms
    const classroomNames = ['9A', '10B', '11A', '12A'];
    const createdClassrooms = [];
    
    for (const className of classroomNames) {
      let classroom = classrooms.find(c => c.name === className);
      if (!classroom) {
        const level = parseInt(className.match(/\d+/)?.[0] || '9');
        classroom = await apiRequest('/classrooms', {
          method: 'POST',
          body: JSON.stringify({ name: className, level: level }),
        });
        console.log('Created classroom:', classroom);
      }
      createdClassrooms.push(classroom);
    }

    // Assign student to first classroom
    const studentClassroom = createdClassrooms[0];
    if (!student.classroomId || student.classroomId !== studentClassroom.id) {
      await apiRequest(`/students/${student.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          firstName: student.firstName,
          lastName: student.lastName,
          registrationCode: student.registrationCode,
          classroomId: studentClassroom.id,
        }),
      });
      console.log('Assigned student to classroom:', studentClassroom.name);
    }

    // 2. Create more students for demo
    const studentNames = [
      { firstName: 'Ion', lastName: 'Popescu' },
      { firstName: 'Maria', lastName: 'Ionescu' },
      { firstName: 'Alexandru', lastName: 'Georgescu' },
      { firstName: 'Elena', lastName: 'Dumitrescu' },
      { firstName: 'Andrei', lastName: 'Marinescu' },
    ];

    const createdStudents = [student]; // Start with existing student
    for (let i = 0; i < studentNames.length; i++) {
      const name = studentNames[i];
      const existingStudent = students.find(s => 
        s.firstName === name.firstName && s.lastName === name.lastName
      );
      if (!existingStudent) {
        try {
          const newStudent = await apiRequest('/students', {
            method: 'POST',
            body: JSON.stringify({
              firstName: name.firstName,
              lastName: name.lastName,
              registrationCode: `STU-${Date.now()}-${i}`,
              classroomId: createdClassrooms[i % createdClassrooms.length].id,
            }),
          });
          createdStudents.push(newStudent);
          console.log('Created student:', newStudent);
        } catch (err) {
          console.log('Failed to create student:', name, err.message);
        }
      } else {
        createdStudents.push(existingStudent);
      }
    }

    // 3. Create courses
    const courseNames = ['Matematică', 'Fizică', 'Chimie', 'Informatică', 'Română', 'Engleză', 'Istorie', 'Biologie'];
    const createdCourses = [];
    
    for (const courseName of courseNames) {
      let course = courses.find(c => c.name === courseName);
      if (!course) {
        course = await apiRequest('/courses', {
          method: 'POST',
          body: JSON.stringify({ name: courseName }),
        });
        console.log('Created course:', course);
      }
      createdCourses.push(course);
    }

    // 4. Create class-courses (assign courses to classrooms with teacher)
    const existingClassCourses = await apiRequest('/class-courses');
    const classCourses = [];
    
    for (const classroom of createdClassrooms) {
      for (let i = 0; i < Math.min(createdCourses.length, 4); i++) {
        const course = createdCourses[i];
        let classCourse = existingClassCourses.find(cc => 
          (cc.classroom?.id === classroom.id || cc.classroomId === classroom.id) &&
          (cc.course?.id === course.id || cc.courseId === course.id)
        );
        if (!classCourse) {
          try {
            classCourse = await apiRequest('/class-courses', {
              method: 'POST',
              body: JSON.stringify({
                classroomId: classroom.id,
                courseId: course.id,
                teacherId: teacher.id,
              }),
            });
            console.log('Created class-course:', classCourse);
          } catch (err) {
            console.log('Failed to create class-course:', err.message);
            continue;
          }
        }
        if (classCourse) classCourses.push(classCourse);
      }
    }

    // 5. Create parents for students
    const existingParents = await apiRequest('/parents');
    for (const student of createdStudents) {
      const existingParent = existingParents.find(p => 
        (p.student?.id === student.id || p.studentId === student.id)
      );
      if (!existingParent) {
        try {
          const parent = await apiRequest('/parents', {
            method: 'POST',
            body: JSON.stringify({
              firstName: `Părinte ${student.firstName}`,
              lastName: student.lastName,
              registrationCode: `PARENT-${student.id}-${Date.now()}`,
              studentId: student.id,
            }),
          });
          console.log('Created parent:', parent);
        } catch (err) {
          console.log('Failed to create parent for student:', student.firstName, err.message);
        }
      }
    }

    // 6. Create grades for students
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 30; i++) {
      dates.push(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i));
    }

    const existingGrades = [];
    for (const student of createdStudents) {
      try {
        const studentGrades = await apiRequest(`/api/grades/student/${student.id}`);
        existingGrades.push(...studentGrades);
      } catch (err) {
        console.log('Error fetching grades for student:', student.id);
      }
    }

    let gradesAdded = 0;
    for (const student of createdStudents) {
      const studentClassroom = createdClassrooms.find(c => c.id === student.classroomId);
      if (!studentClassroom) continue;

      const studentClassCourses = classCourses.filter(cc => 
        (cc.classroom?.id === studentClassroom.id || cc.classroomId === studentClassroom.id)
      );

      for (let i = 0; i < Math.min(studentClassCourses.length, 5); i++) {
        const classCourse = studentClassCourses[i];
        const date = dates[Math.floor(Math.random() * dates.length)];
        const dateStr = date.toISOString().split('T')[0];
        
        // Check if grade already exists
        const existingGrade = existingGrades.find(g => 
          (g.student?.id === student.id || g.studentId === student.id) &&
          (g.classCourse?.id === classCourse.id || g.classCourseId === classCourse.id) &&
          g.date === dateStr
        );
        
        if (existingGrade) continue;

        const grade = Math.floor(Math.random() * 4) + 7; // Grades between 7-10

        try {
          // Format date as dd-MM-yyyy for backend
          const [year, month, day] = dateStr.split('-');
          const formattedDate = `${day}-${month}-${year}`;
          
          const gradeData = {
            studentId: student.id,
            classCourseId: classCourse.id,
            dateGiven: formattedDate,
            value: grade,
          };
          
          const createdGrade = await apiRequest('/api/grades', {
            method: 'POST',
            body: JSON.stringify(gradeData),
          });
          gradesAdded++;
          console.log(`Created grade ${grade} for ${student.firstName} in ${classCourse.course?.name}`);
        } catch (err) {
          console.log('Failed to create grade:', err.message);
        }
      }
    }

    console.log(`✅ Demo test data added successfully!`);
    console.log(`- Classrooms: ${createdClassrooms.length}`);
    console.log(`- Students: ${createdStudents.length}`);
    console.log(`- Courses: ${createdCourses.length}`);
    console.log(`- Class-Courses: ${classCourses.length}`);
    console.log(`- Grades: ${gradesAdded} new grades added`);
    alert(`Demo test data added successfully!\n\n- Classrooms: ${createdClassrooms.length}\n- Students: ${createdStudents.length}\n- Courses: ${createdCourses.length}\n- Grades: ${gradesAdded} new grades\n\nRefresh the page to see the changes.`);
  } catch (error) {
    console.error('Error adding demo test data:', error);
    alert('Error: ' + error.message);
  }
}

// Run the script
addDemoTestData();

