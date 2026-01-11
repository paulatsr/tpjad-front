export const mockClassroomDetails = {
  id: 1,
  name: "10A",
  homeroomTeacher: { firstName: "Ana", lastName: "Pop" },

  students: [
    { id: 1, firstName: "Maria", lastName: "Ionescu" },
    { id: 2, firstName: "Andrei", lastName: "Popescu" },
  ],

  courses: [
    { id: 1, course: { name: "Matematică" }, teacher: { firstName: "Ion", lastName: "Ciobanu" }},
    { id: 2, course: { name: "Română" }, teacher: { firstName: "Lavinia", lastName: "Stan" }},
  ],

  grades: [
    {
      id: 1,
      student: { firstName: "Maria", lastName: "Ionescu" },
      classCourse: { course: { name: "Matematică" }, teacher: { firstName: "Ion", lastName: "Ciobanu" }},
      value: 10
    }
  ],

  absences: [
    {
      id: 1,
      student: { firstName: "Andrei", lastName: "Popescu" },
      classCourse: { course: { name: "Română" }, teacher: { firstName: "Lavinia", lastName: "Stan" }},
      excused: false
    }
  ]
};
