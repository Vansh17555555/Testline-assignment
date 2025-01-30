// utils/parseQuiz.ts

export interface Option {
  id: number;
  description: string;
  question_id: number;
  is_correct: boolean;
  created_at: string;
  updated_at: string;
  unanswered: boolean;
  photo_url: string | null;
}

export interface PracticeMaterial {
  content: string[];
  keywords: string[];
}

export interface ReadingMaterial {
  id: number;
  keywords: string;
  content: string | null;
  created_at: string;
  updated_at: string;
  content_sections: string[];
  practice_material?: PracticeMaterial;
}

export interface Question {
  id: number;
  description: string;
  difficulty_level: string | null;
  topic: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  detailed_solution: string;
  type: string;
  is_mandatory: boolean;
  show_in_feed: boolean;
  pyq_label: string | null;
  topic_id: number;
  reading_material_id: number;
  fixed_at: string | null;
  fix_summary: string | null;
  created_by: string | null;
  updated_by: string | null;
  quiz_level: string | null;
  question_from: string;
  language: string | null;
  photo_url: string | null;
  photo_solution_url: string | null;
  is_saved: boolean;
  tag: string;
  options: Option[];
  reading_material?: ReadingMaterial;
}

export interface QuizData {
  id: number;
  name: string | null;
  title: string;
  description: string;
  difficulty_level: string | null;
  topic: string;
  time: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  duration: number;
  end_time: string;
  negative_marks: string;
  correct_answer_marks: string;
  shuffle: boolean;
  show_answers: boolean;
  lock_solutions: boolean;
  is_form: boolean;
  show_mastery_option: boolean;
  reading_material: string | null;
  quiz_type: string | null;
  is_custom: boolean;
  banner_id: number | null;
  exam_id: number | null;
  show_unanswered: boolean;
  ends_at: string;
  lives: number | null;
  live_count: string;
  coin_count: number;
  questions_count: number;
  daily_date: string;
  max_mistake_count: number;
  reading_materials: any[];
  questions: Question[];
  progress: number;
}

export function parseQuizData(data: any): QuizData {
  return {
    id: data.id,
    name: data.name,
    title: data.title,
    description: data.description,
    difficulty_level: data.difficulty_level,
    topic: data.topic,
    time: data.time,
    is_published: data.is_published,
    created_at: data.created_at,
    updated_at: data.updated_at,
    duration: data.duration,
    end_time: data.end_time,
    negative_marks: data.negative_marks,
    correct_answer_marks: data.correct_answer_marks,
    shuffle: data.shuffle,
    show_answers: data.show_answers,
    lock_solutions: data.lock_solutions,
    is_form: data.is_form,
    show_mastery_option: data.show_mastery_option,
    reading_material: data.reading_material,
    quiz_type: data.quiz_type,
    is_custom: data.is_custom,
    banner_id: data.banner_id,
    exam_id: data.exam_id,
    show_unanswered: data.show_unanswered,
    ends_at: data.ends_at,
    lives: data.lives,
    live_count: data.live_count,
    coin_count: data.coin_count,
    questions_count: data.questions_count,
    daily_date: data.daily_date,
    max_mistake_count: data.max_mistake_count,
    reading_materials: data.reading_materials,
    questions: data.questions.map((q: any) => ({
      id: q.id,
      description: q.description,
      difficulty_level: q.difficulty_level,
      topic: q.topic,
      is_published: q.is_published,
      created_at: q.created_at,
      updated_at: q.updated_at,
      detailed_solution: q.detailed_solution,
      type: q.type,
      is_mandatory: q.is_mandatory,
      show_in_feed: q.show_in_feed,
      pyq_label: q.pyq_label,
      topic_id: q.topic_id,
      reading_material_id: q.reading_material_id,
      fixed_at: q.fixed_at,
      fix_summary: q.fix_summary,
      created_by: q.created_by,
      updated_by: q.updated_by,
      quiz_level: q.quiz_level,
      question_from: q.question_from,
      language: q.language,
      photo_url: q.photo_url,
      photo_solution_url: q.photo_solution_url,
      is_saved: q.is_saved,
      tag: q.tag,
      options: q.options.map((o: any) => ({
        id: o.id,
        description: o.description,
        question_id: o.question_id,
        is_correct: o.is_correct,
        created_at: o.created_at,
        updated_at: o.updated_at,
        unanswered: o.unanswered,
        photo_url: o.photo_url
      })),
      reading_material: q.reading_material ? {
        id: q.reading_material.id,
        keywords: q.reading_material.keywords,
        content: q.reading_material.content,
        created_at: q.reading_material.created_at,
        updated_at: q.reading_material.updated_at,
        content_sections: q.reading_material.content_sections,
        practice_material: q.reading_material.practice_material ? {
          content: q.reading_material.practice_material.content,
          keywords: q.reading_material.practice_material.keywords
        } : undefined
      } : undefined
    })),
    progress: data.progress
  };
}