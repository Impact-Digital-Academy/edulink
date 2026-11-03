export interface CodedItem {
  readonly code: string;
  readonly name: string;
}

export interface SubjectItem extends CodedItem {
  readonly groupCode: string;
}

export interface QualificationItem extends CodedItem {
  readonly rank: number;
}

export const subjectGroups: readonly CodedItem[] = [
  { code: 'languages', name: 'Languages' },
  { code: 'maths_sciences', name: 'Mathematics and sciences' },
  { code: 'computing', name: 'Computing' },
  { code: 'social_sciences', name: 'Social sciences and religious studies' },
  { code: 'business', name: 'Business and commerce' },
  { code: 'arts_practical', name: 'Arts and practical subjects' },
  { code: 'early_primary', name: 'Early years and primary' },
  { code: 'special_education', name: 'Special education' },
];

export const subjects: readonly SubjectItem[] = [
  { code: 'english_language', name: 'English Language', groupCode: 'languages' },
  { code: 'literature_in_english', name: 'Literature in English', groupCode: 'languages' },
  { code: 'yoruba', name: 'Yoruba', groupCode: 'languages' },
  { code: 'igbo', name: 'Igbo', groupCode: 'languages' },
  { code: 'hausa', name: 'Hausa', groupCode: 'languages' },
  { code: 'french', name: 'French', groupCode: 'languages' },
  { code: 'arabic', name: 'Arabic', groupCode: 'languages' },

  { code: 'mathematics', name: 'Mathematics', groupCode: 'maths_sciences' },
  { code: 'further_mathematics', name: 'Further Mathematics', groupCode: 'maths_sciences' },
  { code: 'basic_science', name: 'Basic Science', groupCode: 'maths_sciences' },
  { code: 'basic_technology', name: 'Basic Technology', groupCode: 'maths_sciences' },
  { code: 'physics', name: 'Physics', groupCode: 'maths_sciences' },
  { code: 'chemistry', name: 'Chemistry', groupCode: 'maths_sciences' },
  { code: 'biology', name: 'Biology', groupCode: 'maths_sciences' },
  { code: 'agricultural_science', name: 'Agricultural Science', groupCode: 'maths_sciences' },
  { code: 'physical_health_education', name: 'Physical and Health Education', groupCode: 'maths_sciences' },

  { code: 'computer_studies_ict', name: 'Computer Studies or ICT', groupCode: 'computing' },
  { code: 'data_processing', name: 'Data Processing', groupCode: 'computing' },
  { code: 'coding_robotics', name: 'Coding and Robotics', groupCode: 'computing' },

  { code: 'civic_education', name: 'Civic Education', groupCode: 'social_sciences' },
  { code: 'social_studies', name: 'Social Studies', groupCode: 'social_sciences' },
  { code: 'government', name: 'Government', groupCode: 'social_sciences' },
  { code: 'economics', name: 'Economics', groupCode: 'social_sciences' },
  { code: 'history', name: 'History', groupCode: 'social_sciences' },
  { code: 'geography', name: 'Geography', groupCode: 'social_sciences' },
  { code: 'christian_religious_studies', name: 'Christian Religious Studies', groupCode: 'social_sciences' },
  { code: 'islamic_studies', name: 'Islamic Studies', groupCode: 'social_sciences' },

  { code: 'financial_accounting', name: 'Financial Accounting', groupCode: 'business' },
  { code: 'commerce', name: 'Commerce', groupCode: 'business' },
  { code: 'business_studies', name: 'Business Studies', groupCode: 'business' },
  { code: 'office_practice', name: 'Office Practice', groupCode: 'business' },
  { code: 'marketing', name: 'Marketing', groupCode: 'business' },
  { code: 'entrepreneurship', name: 'Entrepreneurship', groupCode: 'business' },

  { code: 'fine_art', name: 'Fine Art', groupCode: 'arts_practical' },
  { code: 'music', name: 'Music', groupCode: 'arts_practical' },
  { code: 'drama', name: 'Drama', groupCode: 'arts_practical' },
  { code: 'home_economics', name: 'Home Economics', groupCode: 'arts_practical' },
  { code: 'food_nutrition', name: 'Food and Nutrition', groupCode: 'arts_practical' },
  { code: 'technical_drawing', name: 'Technical Drawing', groupCode: 'arts_practical' },
  { code: 'cultural_creative_arts', name: 'Cultural and Creative Arts', groupCode: 'arts_practical' },

  { code: 'phonics', name: 'Phonics', groupCode: 'early_primary' },
  { code: 'quantitative_reasoning', name: 'Quantitative Reasoning', groupCode: 'early_primary' },
  { code: 'verbal_reasoning', name: 'Verbal Reasoning', groupCode: 'early_primary' },
  { code: 'handwriting', name: 'Handwriting', groupCode: 'early_primary' },
  { code: 'all_subject_primary', name: 'All-subject primary teaching', groupCode: 'early_primary' },

  { code: 'special_inclusive_education', name: 'Special-needs and inclusive education', groupCode: 'special_education' },
];

export const levels: readonly CodedItem[] = [
  { code: 'early_years', name: 'Early years (creche, nursery, pre-primary)' },
  { code: 'lower_primary', name: 'Lower primary (Basic 1 to 3)' },
  { code: 'upper_primary', name: 'Upper primary (Basic 4 to 6)' },
  { code: 'junior_secondary', name: 'Junior secondary (JSS 1 to 3)' },
  { code: 'senior_secondary', name: 'Senior secondary (SS 1 to 3)' },
];

export const curricula: readonly CodedItem[] = [
  { code: 'nigerian', name: 'Nigerian (basic and senior secondary; WAEC and NECO)' },
  { code: 'british', name: 'British (Cambridge IGCSE and A-Level, Edexcel)' },
  { code: 'american', name: 'American' },
  { code: 'ib', name: 'International Baccalaureate' },
  { code: 'montessori', name: 'Montessori' },
  { code: 'islamic_arabic', name: 'Islamic or Arabic school curriculum' },
];

// Rank is only used to compare "minimum qualification". It is a judgement call
// and must be reviewed with real teachers and school owners.
export const qualifications: readonly QualificationItem[] = [
  { code: 'early_years_diploma', name: 'Montessori or early-years diploma', rank: 10 },
  { code: 'ond_hnd', name: 'OND or HND (technical subjects)', rank: 20 },
  { code: 'nce', name: 'NCE', rank: 30 },
  { code: 'bachelors_subject_only', name: "Bachelor's degree in a subject only", rank: 40 },
  { code: 'bed', name: 'B.Ed', rank: 50 },
  { code: 'bachelors_plus_pgde', name: "Bachelor's degree in a subject plus PGDE", rank: 60 },
  { code: 'masters_education', name: "Master's in Education", rank: 70 },
  { code: 'masters_other', name: "Other master's degree", rank: 75 },
  { code: 'phd', name: 'PhD', rank: 90 },
];

export const jobTypes: readonly CodedItem[] = [
  { code: 'full_time', name: 'Full time' },
  { code: 'part_time', name: 'Part time' },
  { code: 'contract', name: 'Contract' },
  { code: 'internship_teaching_practice', name: 'Internship or teaching practice' },
  { code: 'lesson_teacher', name: 'Lesson teacher (extra lessons)' },
];

export const roleTypes: readonly CodedItem[] = [
  { code: 'subject_teacher', name: 'Subject teacher' },
  { code: 'class_teacher', name: 'Class teacher' },
  { code: 'head_of_department', name: 'Head of department' },
  { code: 'vice_principal_or_principal', name: 'Vice principal or principal' },
  { code: 'teaching_assistant', name: 'Teaching assistant' },
  { code: 'special_needs_teacher', name: 'Special-needs teacher' },
  { code: 'lesson_tutor', name: 'Home or lesson tutor' },
  { code: 'guidance_counsellor', name: 'Guidance counsellor' },
  { code: 'librarian', name: 'Librarian' },
  { code: 'lab_technician', name: 'Lab technician' },
];

export const states: readonly CodedItem[] = [
  { code: 'abia', name: 'Abia' },
  { code: 'adamawa', name: 'Adamawa' },
  { code: 'akwa_ibom', name: 'Akwa Ibom' },
  { code: 'anambra', name: 'Anambra' },
  { code: 'bauchi', name: 'Bauchi' },
  { code: 'bayelsa', name: 'Bayelsa' },
  { code: 'benue', name: 'Benue' },
  { code: 'borno', name: 'Borno' },
  { code: 'cross_river', name: 'Cross River' },
  { code: 'delta', name: 'Delta' },
  { code: 'ebonyi', name: 'Ebonyi' },
  { code: 'edo', name: 'Edo' },
  { code: 'ekiti', name: 'Ekiti' },
  { code: 'enugu', name: 'Enugu' },
  { code: 'fct', name: 'Federal Capital Territory (Abuja)' },
  { code: 'gombe', name: 'Gombe' },
  { code: 'imo', name: 'Imo' },
  { code: 'jigawa', name: 'Jigawa' },
  { code: 'kaduna', name: 'Kaduna' },
  { code: 'kano', name: 'Kano' },
  { code: 'katsina', name: 'Katsina' },
  { code: 'kebbi', name: 'Kebbi' },
  { code: 'kogi', name: 'Kogi' },
  { code: 'kwara', name: 'Kwara' },
  { code: 'lagos', name: 'Lagos' },
  { code: 'nasarawa', name: 'Nasarawa' },
  { code: 'niger', name: 'Niger' },
  { code: 'ogun', name: 'Ogun' },
  { code: 'ondo', name: 'Ondo' },
  { code: 'osun', name: 'Osun' },
  { code: 'oyo', name: 'Oyo' },
  { code: 'plateau', name: 'Plateau' },
  { code: 'rivers', name: 'Rivers' },
  { code: 'sokoto', name: 'Sokoto' },
  { code: 'taraba', name: 'Taraba' },
  { code: 'yobe', name: 'Yobe' },
  { code: 'zamfara', name: 'Zamfara' },
];