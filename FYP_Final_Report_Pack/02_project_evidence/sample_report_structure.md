# Sample Report Structure

Pages: 93

- DECLARATION
- ACKNOWLEDGEMENT
- ABSTRACT
- DECLARATION ................................ ................................ ............................. 3
- ACKNOWLEDGEMENT ................................ ................................ ................. 4
- ABSTRACT ................................ ................................ ................................ .... 5
- CHAPTER 1 INTRODUCTION ................................ ................................ ..... 13
- 1.1 Overview ................................ ................................ ............................... 13
- 1.2 Problem Statement................................ ................................ ................. 14
- 1.3 Project Scope ................................ ................................ ......................... 15
- 1.4 Report Outline ................................ ................................ ....................... 16
- CHAPTER 2 LITERATURE REVIEW ................................ ........................... 17
- 2.1 Introduction Section ................................ ................................ ............... 17
- 2.2 Literature Review Section................................ ................................ ....... 17
- Chapter 3: DETAILS OF THE DESIGN ................................ .......................... 20
- 3.1 Microcontroller —ESP32 WROOM DEVKIT 38 PINS ............................. 20
- 3.1.1 Other Microcontroller variance ................................ ......................... 22
- 3.2 Sensor – MPU6050 Accelerometer and Gyroscope Sensor ......................... 24
- 3.3 Data Storage – MicroSD Module and Card ................................ .............. 26
- 3.4 Power Supply and Calculations ................................ ............................... 30
- 3.4.1 - 3.7v 450mAh LiPo battery ................................ .............................. 30
- 3.4.2 - MT3608 DC-DC 5V Boost Converter ................................ ............... 31
- 3.4.3 - TP4056 Charger Module................................ ................................ . 32
- 3.4.4 - Calculation and Equation ................................ ............................... 34
- 3.5 PCB Design and Fabrication ................................ ................................ ... 36
- 3.6 Overview of Hardware Design ................................ ................................ 39
- 3.7 Software Architecture and Coding ................................ .......................... 40
- CHAPTER 4 RESULTS AND DISCUSSION ................................ ................... 44
- 4.1 Bicycle Testing of Wheel-Mounted Accelerometer ................................ .... 44
- 4.2 Vehicle Testing of Wheel-Mounted Accelerometer ................................ .... 46
- 4.3 Multiple Test Conditions and Methodology of Experiments....................... 48
- 4.3.1 Optimize Sensor Placement on Wheel Hub Experiment....................... 49
- 4.3.1 (a) Sensor Place at Centre Wheel Hub ................................ ............ 49
- 4.3.1 (b) Sensor Placed in between the Wheel Hub Bolts ........................... 51
- 4.3.1 (c) Sensor Placed at Edge of Wheel Hub ................................ .......... 53
- 4.3.2 Security Wheel Theft Detection Experiment ................................ ....... 55
- 4.3.3 Extreme Scenario for “Wheelie" Experiment ................................ ..... 57
- 4.3.4 Maintenance Awareness for Flat Tyre Experiment ............................. 59
- 4.4.5 Idle Parking beside Ongoing Traffic Experiment ................................ 61
- 4.4 Full Driving Campus Road Experiment and Data collection ...................... 62
- 4.5 Machine Learning Training on Wheel and Tyre Prediction ....................... 65
- 4.5.1 Flat Wheel Detection ................................ ................................ ........ 66
- 4.5.2 Wheel Performance Issue ................................ ................................ .. 67
- 4.5.3 Wheel Motion Event ................................ ................................ ......... 69
- 4.5.4 Road Condition Detection ................................ ................................ . 71
- CHAPTER 5 CONCLUSIONS ................................ ................................ ........ 74
- 5.1 Summary and Conclusions ................................ ................................ ..... 74
- 5.2 Areas of Future Research ................................ ................................ ....... 76
- 5.2.1 Implementation of Cloud storage and IoT connection ......................... 76
- 5.2.2 Improved Mounting and Protection of Circuit ................................ .... 77
- 5.2.3 ESP-NOW Protocol for Multi-Sensor Use ................................ .......... 77
- REFERENCES ................................ ................................ .............................. 78
- APPENDIX ................................ ................................ ................................ ... 79
- CHAPTER 1 INTRODUCTION
- 1.1 Overview
- 1.2 Problem Statement
- 1.3 Project Scope
- 1.4 Report Outline
- Chapter 1 is an introduction that provides readers with a background of the project, which
- Chapter 2 provides a comprehensive literature review, a discussion on existing research
- Chapter 3 describes the system design in detail, covering both hardware and software
- Chapter 4 focuses on data collection presented through tables and deep analyses, followed
- Chapter 5 summarises the achievements and conclusions from the project, alongside
- CHAPTER 2 LITERATURE REVIEW
- 2.1 Introduction Section
- 2.2 Literature Review Section
- Chapter 3: DETAILS OF THE DESIGN
- 3.1 Microcontroller —ESP32 WROOM DEVKIT 38 PINS
- 3.1.1 Other Microcontroller variance
- 3.2 Sensor – MPU6050 Accelerometer and Gyroscope Sensor
- 3.3 Data Storage – MicroSD Module and Card
- 3.4 Power Supply and Calculations
- 3.4.1 - 3.7v 450mAh LiPo battery
- 3.4.2 - MT3608 DC-DC 5V Boost Converter
- 3.4.3 - TP4056 Charger Module
- 3.4.4 - Calculation and Equation
- 3.5 PCB Design and Fabrication
- 3.6 Overview of Hardware Design
- 3.7 Software Architecture and Coding
- CHAPTER 4 RESULTS AND DISCUSSION
- 4.1 Bicycle Testing of Wheel-Mounted Accelerometer
- 4.2 Vehicle Testing of Wheel-Mounted Accelerometer
- 4.4 above, the waveform created was clearer and can be analysed easily. Following the
- 4.3 Multiple Test Conditions and Methodology of Experiments
- 4.3.1 Optimize Sensor Placement on Wheel Hub Experiment
- 4.3.1 (a) Sensor Place at Centre Wheel Hub
- 4.3.1 (b) Sensor Placed in between the Wheel Hub Bolts
- 4.3.1 (c) Sensor Placed at Edge of Wheel Hub
- 4.3.2 Security Wheel Theft Detection Experiment
- 4.3.3 Extreme Scenario for “Wheelie" Experiment
- 4.3.4 Maintenance Awareness for Flat Tyre Experiment
- 4.4.5 Idle Parking beside Ongoing Traffic Experiment
- 4.4 Full Driving Campus Road Experiment and Data collection
- 4.5 Machine Learning Training on Wheel and Tyre Prediction
- 4.5.1 Flat Wheel Detection
- 4.5.2 Wheel Performance Issue
- 4.5.3 Wheel Motion Event
- 4.5.4 Road Condition Detection
- CHAPTER 5 CONCLUSIONS
- 5.1 Summary and Conclusions
- 5.2 Areas of Future Research
- 5.2.1 Implementation of Cloud storage and IoT connection
- 5.2.2 Improved Mounting and Protection of Circuit
- 5.2.3 ESP-NOW Protocol for Multi-Sensor Use
- REFERENCES
- APPENDIX

## First Pages Extract

   
 
 1  
 
Design and Study of a Wheel-Mounted 
Accelerometer system for Real-Time Monitoring of 
Road Conditions and Vehicle Safety 
 
By  
MEGAT MUHAMMAD MARZUQIE  
BIN MEGAT MUZZAFAR 
1211101665 
 
Session 2025/2026  
 
 
 
 
The project report is prepared for 
 Faculty of Artificial Intelligence Engineering, 
 Multimedia University  
in partial fulfillment of  
Bachelor of Science (Honours) majoring in Intelligence Robotics 
 
 
 
FACULTY OF AI & ENGINEERING 
MULTIMEDIA UNIVERSITY 
FEBRUARY 2026 
 
 

---

   
 
 2  
 
© 2025 Universiti Telekom Sdn. Bhd.  ALL RIGHTS RESERVED. 
Copyright of this report belongs to Universiti Telekom Sdn. Bhd. as qualified by 
Regulation 7.2 (c) of the Multimedia University Intellectual Property and 
Commercialisation Policy. No part of this publication may be reproduced, stored in or 
introduced into a retrieval system, or transmitted in any form or by any means (electronic, 
mechanical, photocopying, recording, or otherwise), or for any purpose, without the 
express written permission of Universiti Telekom Sdn. Bhd. Due acknowledgement shall 
always be made of the use of any material contained in, or derived from, this report. 
 

---

   
 
 3  
 
DECLARATION 
 
I hereby declare that this work has been done by myself and no portion of the work 
contained in this report has been submitted in support of any application for any other 
degree or qualification of this or any other university or institute of learning. 
I also declare that pursuant to the provisions of the Copyright Act 1987, I have not engaged 
in any unauthorised act of copying or reproducing or attempt to copy / reproduce or cause 
to copy / reproduce or permit the copying / reproducing or the sharing an d / or 
downloading of any copyrighted material or an attempt to do so whether by use of the 
University’s facilities or outside networks / facilities whether in hard copy or soft copy 
format, of any material protected under the provisions of sections 3 and 7 of the Act 
whether for payment or otherwise save as specifically provided for therein. This shall 
include but not be limited to any lecture notes, course packs, thesis, text books, exam 
questions, any works of authorship fixed in any tangible medium of e xpression whether 
provided by the University or otherwise. 
I hereby further declare that in the event of any infringement of the provisions of the Act 
whether knowingly or unknowingly the University shall not be liable for the same in any 
manner whatsoever and undertakes to indemnify and keep indemnified the Unive rsity 
against all such claims and actions. 
 
Signature: ________________________ 
Name: Megat Muhammad Marzuqie Bin Megat Muzaffar 
Student ID: 1211101665  
Date: 15 December 2025 

---

   
 
 4  
 
ACKNOWLEDGEMENT 
 
I would like to express my deepest gratitude to my project supervisor, Ir. Dr. Shashikumar 
A/L Krishnan, for his invaluable guidance, insightful feedback, and unwavering support 
throughout the course of this project.  His insightful feedback and dedication have been 
instrumental in the development and implementation of this project.  Without his 
knowledge and guidance, I would not have been able to make this research project possible.  
 
I am deeply grateful to my family and friends for their never -ending support throughout 
my final year project. Their encouragement and support have gotten me through tough 
times. Especially after many sleepless nights, this project has really helped me understand 
more. My family's unconditional love really brought my focus back to work.  
 
I would also like to acknowledge friends from the MMU Cybertron team who supported 
me throughout the development of this project by giving their  support and valuable 
feedback. I truly appreciate their insight and knowledge that improve my research findings.  
 
 
 
 
 

---

   
 
 5  
 
ABSTRACT 
Road infrastructure quality significantly impacts vehicle safety and maintenance costs. 
This wheel -mounted accelerometer system is designed for real -time road condition 
monitoring and safety detection. The system uses an ESP32 microcontroller connected to 
an MPU6050 accelerometer and gyroscope to measure high-frequency vibration and tri-
axial acceleration data directly from the wheel hub. The data logging is managed via a 
microSD module to maintain data integrity during high -speed rotation, while power is 
supplied by a 3.7V 450 mAh LiPo battery optimised to withstand the centrifugal forces of 
the wheel environment  that is stepped up by the MT3608 DC-DC boost converter that 
supplies constant 5V.  
Using this hardware, the e xperimental results demonstrate that the system effectively 
distinguishes between distinct surface profiles, including bumps, potholes, and uneven 
surfaces, based on variations in vibration frequency and magnitude. The sensor output 
correlates directly with road roughness, allowing for precise identification of surface 
irregularities. Using machine learning algorithms that were trained by the data collected 
from multiple experiments to aid in the detection of faulty wheels, hazardous road 
conditions, wheel motions, and low-pressure tyres. This can benefit vehicle maintenance 
and improve driver awareness when on the road. The prototype offers a cost -effective, 
scalable solution for municipal road maintenance and real -time driver safety alerts, 
proving the viability of wheel-hub sensing as a robust method for automated infrastructure 
auditing.  
 

---

   
 
 6  
 
TABLE OF CONTENTS 
 
DECLARATION ................................ ................................ .............................  3 
ACKNOWLEDGEMENT ................................ ................................ ................. 4 
ABSTRACT ................................ ................................ ................................ .... 5 
TABLE OF CONTENTS ................................ ................................ ....................  6 
LIST OF FIGURES ................................ ................................ ..........................  8 
LIST OF TABLES ................................ ................................ .........................  11 
LIST OF ABBREVIATIONS ................................ ................................ .......... 12 
CHAPTER 1 INTRODUCTION ................................ ................................ ..... 13 
1.1 Overview ................................ ................................ ...............................  13 
1.2 Problem Statement................................ ................................ ................. 14 
1.3 Project Scope ................................ ................................ .........................  15 
1.4 Report Outline ................................ ................................ .......................  16 
CHAPTER 2 LITERATURE REVIEW ................................ ...........................  17 
2.1 Introduction Section ................................ ................................ ............... 17 
2.2 Literature Review Section................................ ................................ ....... 17 
Chapter 3: DETAILS OF THE DESIGN ................................ ..........................  20 
3.1 Microcontroller —ESP32 WROOM DE

---

   
 
 7  
 
3.6 Overview of Hardware Design ................................ ................................  39 
3.7 Software Architecture and Coding ................................ ..........................  40 
CHAPTER 4 RESULTS AND DISCUSSION ................................ ...................  44 
4.1 Bicycle Testing of Wheel-Mounted Accelerometer ................................ .... 44 
4.2 Vehicle Testing of Wheel-Mounted Accelerometer ................................ .... 46 
4.3 Multiple Test Conditions and Methodology of Experiments.......................  48 
4.3.1 Optimize Sensor Placement on Wheel Hub Experiment.......................  49 
4.3.1 (a) Sensor Place at Centre Wheel Hub ................................ ............ 49 
4.3.1 (b) Sensor Placed in between the Wheel Hub Bolts ...........................  51 
4.3.1 (c) Sensor Placed at Edge of Wheel Hub ................................ .......... 53 
4.3.2 Security Wheel Theft Detection Experiment ................................ ....... 55 
4.3.3 Extreme Scenario for “Wheelie" Experiment ................................ ..... 57 
4.3.4 Maintenance Awareness for Flat Tyre Experiment .............................  59 
4.4.5 Idle Parking beside Ongoing Traffic Experiment ................................  61 
4.4 Full Driving Campus Road Experiment and Data collection ......................  62 
4.5 Machine Learning Training on Wheel and Tyre Prediction .......................  65 
4.5.1 Flat Wheel Detection ................................ ................................ ........ 66 
4.5.2 Wheel Performance Issue ................................ ................................ .. 67 
4.5.3 Wheel Motion Event ................................ ................................ ......... 69 
4.5.4 

---

   
 
 8  
 
 
 
LIST OF FIGURES 
 
Figure 3.1: ESP32 microcontroller   
Figure 3.2: ESP32 pinout arrangement  
Figure 3.3: 3 axes acted onto sensor  
Figure 3.4: Wheel_data.CSV file that contains raw data  
Figure 3.5: MicroSD module 
Figure 3.6: SD Card Classification 
Figure 3.7: 3.7V 450mAh LiPo Battery as power supply  
Figure 3.8: MT3608 DC-DC Boost Converter   
Figure 3.9: TP4056 Charger Module  
Figure 3.10: Early prototype of design setup   
Figure 3.11: Circuit diagram of wheel mounted accelerometer  
Figure 3.12: PCB design in EasyEDA online  
Figure 3.13: Full setup of wheel-mounted accelerometer at wheel hub  