export type ProgrammeKnowledge = {
  key: "robotics";
  label: string;
  shortName: string;
  aliases: string[];
  source: string;
  overview: string;
  totalCredits?: number;
  terms: { id: string; label: string; aliases: string[]; courses: string[]; courseCodes: string[] }[];
  projectRule: string;
  industrialTrainingRule: string;
  mpuNote: string;
};

export const programmes = [
  {
    "key": "robotics",
    "label": "Bachelor of Science (Honours) in Intelligent Robotics",
    "shortName": "Intelligent Robotics",
    "aliases": [
      "intelligent robotics",
      "intelligent robotic",
      "robotics",
      "robotic",
      "rob"
    ],
    "source": "MMU Intelligent Robotics programme page",
    "overview": "Bachelor of Science (Honours) in Intelligent Robotics is offered by the Faculty of Artificial Intelligence and Engineering (FAIE). It is a 3-year programme. Do you want to know more?",
    "terms": [
      {
        "id": "year-1",
        "label": "Year 1",
        "aliases": [
          "year 1"
        ],
        "courses": [
          "Technical Calculus",
          "Computer and Programming",
          "Micro-Controllers & Microprocessors",
          "Electrical Circuits",
          "Basic Electronics",
          "Differential Equations",
          "Digital Design",
          "Linear Algebra and Numerical Methods",
          "Rapid Modelling",
          "Analog Electronics"
        ],
        "courseCodes": [
          "ARM6113",
          "ARC6113",
          "ARC6123",
          "ARL6113",
          "ARE6113",
          "ARM6123",
          "ARE6123",
          "ARM6133",
          "MID6113",
          "ARE6133"
        ]
      },
      {
        "id": "year-2",
        "label": "Year 2",
        "aliases": [
          "year 2"
        ],
        "courses": [
          "Linear Systems & Signals",
          "Electromagnetics with Applications",
          "Electrical Machines and Power Systems",
          "Robotics - Machine Design and Mechanisms",
          "Introduction to Artificial Intelligence",
          "Actuators and Sensors",
          "Electronics Instrumentation",
          "Robotics - Modelling and Control",
          "Feedback Control",
          "Advanced Programming",
          "Machine Learning Concepts and Technologies",
          "Machine Vision & Image Processing"
        ],
        "courseCodes": [
          "ARL6143",
          "ARL6134",
          "ARL6123",
          "ARR6123",
          "ARA6113",
          "ARR6133",
          "ARC6133",
          "ARR6143",
          "ARC6144",
          "ARC6173",
          "ARA6123",
          "ARA6144"
        ]
      },
      {
        "id": "year-3",
        "label": "Year 3",
        "aliases": [
          "year 3"
        ],
        "courses": [
          "Mobile Robots and Drones",
          "Project I",
          "Project II",
          "Industrial Training",
          "Making Embedded Systems",
          "Robot Programming",
          "Elective 1 BYOC",
          "Elective 2 BYOC",
          "Elective 3 BYOC"
        ],
        "courseCodes": [
          "ARR6153",
          "ARP6110-P1",
          "ARP6110-P2",
          "ART6116",
          "ARC6184",
          "ARR6163",
          "BYOC-1",
          "BYOC-2",
          "BYOC-3"
        ]
      }
    ],
    "projectRule": "Project I requires completed 60 credit hours. Project II requires completed 60 credit hours and Project I.",
    "industrialTrainingRule": "Industrial Training requires completed 60 credit hours.",
    "mpuNote": "University subjects include: Character Building Program: Character Building and Sustainable Society; Fundamentals of Digital Competence for Programmers; U1 - Falsafah dan Isu Semasa; U1 - Penghayatan Etika dan Peradaban Isu Semasa (local students) / Bahasa Melayu Komunikasi 2 (international students); U2 - Bahasa Kebangsaan A / Foreign Language; U3 - Integrity and Leadership; U4 - Co-Curriculum."
  }
] satisfies ProgrammeKnowledge[];
