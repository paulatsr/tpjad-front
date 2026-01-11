// Script to add test data for teacher123 and student123
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

async function addTestData() {
  try {
    console.log('Starting to add test data...');

    // Get existing data
    const students = await apiRequest('/students');
    const teachers = await apiRequest('/teachers');
    const classrooms = await apiRequest('/classrooms');
    const courses = await apiRequest('/courses');

    // Find teacher123 and student123
    const teacher123User = await apiRequest('/users').then(users => 
      users.find(u => u.username === 'teacher123')
    );
    const student123User = await apiRequest('/users').then(users => 
      users.find(u => u.username === 'student123')
    );

    if (!teacher123User || !student123User) {
      console.error('teacher123 or student123 not found!');
      return;
    }

    const teacher = teachers.find(t => t.user?.username === 'teacher123');
    const student = students.find(s => s.user?.username === 'student123');

    if (!teacher || !student) {
      console.error('Teacher or Student entity not found!');
      return;
    }

    console.log('Found teacher:', teacher);
    console.log('Found student:', student);

    // 1. Create or find classroom for teacher
    let classroom = classrooms.find(c => c.name === '12A');
    if (!classroom) {
      classroom = await apiRequest('/classrooms', {
        method: 'POST',
        body: JSON.stringify({ name: '12A', level: 12 }),
      });
      console.log('Created classroom:', classroom);
    }

    // Assign student to classroom
    if (!student.classroomId || student.classroomId !== classroom.id) {
      await apiRequest(`/students/${student.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          firstName: student.firstName,
          lastName: student.lastName,
          registrationCode: student.registrationCode,
          classroomId: classroom.id,
        }),
      });
      console.log('Assigned student to classroom');
    }

    // 2. Create courses if they don't exist
    const courseNames = ['Matematică', 'Fizică', 'Chimie', 'Informatică'];
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

    // 3. Create class-courses (assign courses to classroom with teacher)
    const existingClassCourses = await apiRequest('/class-courses');
    const classCourses = [];
    for (const course of createdCourses) {
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
          console.log('Failed to create class-course for', course.name, err.message);
          continue;
        }
      }
      if (classCourse) classCourses.push(classCourse);
    }

    // 4. Create parent for student
    const existingParents = await apiRequest('/parents');
    const existingParent = existingParents.find(p => 
      (p.student?.id === student.id || p.studentId === student.id)
    );
    if (!existingParent) {
      try {
        const parent = await apiRequest('/parents', {
          method: 'POST',
          body: JSON.stringify({
            firstName: 'Maria',
            lastName: 'Popescu',
            registrationCode: `PARENT-${student.id}-${Date.now()}`,
            studentId: student.id,
          }),
        });
        console.log('Created parent:', parent);
      } catch (err) {
        console.log('Failed to create parent:', err.message);
      }
    } else {
      console.log('Parent already exists for student');
    }

    // 5. Create grades for student
    const existingGrades = await apiRequest(`/api/grades/student/${student.id}`);
    const today = new Date();
    const dates = [
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7),
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5),
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3),
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2),
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
    ];

    const gradesAdded = [];
    for (let i = 0; i < Math.min(classCourses.length, dates.length); i++) {
      const classCourse = classCourses[i];
      const date = dates[i];
      const dateStr = date.toISOString().split('T')[0];
      
      // Check if grade already exists for this classCourse and date
      const existingGrade = existingGrades.find(g => 
        (g.classCourse?.id === classCourse.id || g.classCourseId === classCourse.id) &&
        g.date === dateStr
      );
      
      if (existingGrade) {
        console.log('Grade already exists for', classCourse.course?.name, 'on', dateStr);
        continue;
      }

      const grade = Math.floor(Math.random() * 3) + 7; // Grades between 7-10

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
        gradesAdded.push(createdGrade);
        console.log('Created grade:', createdGrade);
      } catch (err) {
        console.log('Failed to create grade for', classCourse.course?.name, err.message);
      }
    }

    console.log(`Added ${gradesAdded.length} new grades`);

    console.log('✅ Test data added successfully!');
    alert('Test data added successfully! Refresh the page to see the changes.');
  } catch (error) {
    console.error('Error adding test data:', error);
    alert('Error: ' + error.message);
  }
}

// Run the script
addTestData();

