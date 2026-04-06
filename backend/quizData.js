const quizzes = [
  {
    id: "quiz1",
    title: "General Knowledge Quiz",
    questions: [
      {
        id: "q1",
        text: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctOption: 2,
        timeLimit: 20
      },
      {
        id: "q2",
        text: "Which planet is known as the Red Planet?",
        options: ["Earth", "Mars", "Jupiter", "Venus"],
        correctOption: 1,
        timeLimit: 20
      },
      {
        id: "q3",
        text: "What is the largest ocean on Earth?",
        options: ["Atlantic", "Indian", "Arctic", "Pacific"],
        correctOption: 3,
        timeLimit: 20
      }
    ]
  },
  {
    id: "quiz2",
    title: "Programming Basics",
    questions: [
      {
        id: "q_p1",
        text: "What does HTML stand for?",
        options: [
          "Hyper Tool Multi Language",
          "Hyperlink and Text Markup Language",
          "Hyper Text Markup Language",
          "High Text Machine Language"
        ],
        correctOption: 2,
        timeLimit: 20
      },
      {
        id: "q_p2",
        text: "Which of the following is not a programming language?",
        options: ["Python", "JavaScript", "HTML", "C++"],
        correctOption: 2,
        timeLimit: 20
      }
    ]
  }
];

module.exports = { quizzes };
