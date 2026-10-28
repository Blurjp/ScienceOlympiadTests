/** Short, original examples for visitors to try without signing in. */
export const SAMPLE_QUESTIONS: Record<string, { question: string; options: string[]; answer: string; explanation: string }> = {
  Astronomy: {
    question: 'Two stars have the same luminosity. If Star B is twice as far away as Star A, how does its apparent brightness compare?',
    options: ['Half as bright', 'One-quarter as bright', 'Twice as bright', 'Four times as bright'],
    answer: 'One-quarter as bright',
    explanation: 'Apparent brightness follows the inverse-square law. Doubling the distance reduces the received flux to 1/2², or one-quarter.',
  },
  'Anatomy and Physiology': {
    question: 'Which chamber of the heart pumps oxygenated blood into the aorta?',
    options: ['Right atrium', 'Right ventricle', 'Left atrium', 'Left ventricle'],
    answer: 'Left ventricle',
    explanation: 'The left ventricle pumps oxygenated blood through the aortic valve into the aorta, which distributes it to the body.',
  },
  'Disease Detectives': {
    question: 'At a picnic, 30 of 60 people who ate potato salad became ill. What was the attack rate among those who ate it?',
    options: ['30%', '50%', '60%', '90%'],
    answer: '50%',
    explanation: 'The attack rate in the exposed group is the number who became ill divided by the total who ate the salad: 30 ÷ 60 = 50%.',
  },
};
