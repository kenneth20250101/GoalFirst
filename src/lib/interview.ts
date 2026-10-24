import { z } from 'zod';
export const questionSchema=z.object({id:z.string().min(1).max(60),prompt:z.string().min(1).max(250),reason:z.string().max(250),kind:z.enum(['text','choice','date','number']),options:z.array(z.string().max(100)).max(6)});
export const interviewSchema=z.object({summary:z.string().max(400),ready:z.boolean(),questions:z.array(questionSchema).max(3),context:z.object({city:z.string().max(100).nullable(),country:z.string().max(100).nullable(),startDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),days:z.number().int().min(1).max(60).nullable(),purpose:z.enum(['Leisure','Business','General']).nullable(),activities:z.enum(['Mixed','Mostly outdoors','Mostly indoors']).nullable(),coldSensitive:z.boolean().nullable()})});
export const answerSchema=z.object({question:z.string().max(250),answer:z.string().max(1000)});
export const interviewRequestSchema=z.object({goalText:z.string().trim().min(1).max(2000),answers:z.array(answerSchema).max(18),knownItems:z.array(z.object({name:z.string().max(120),status:z.string().max(30)})).max(20).optional(),notes:z.string().max(2000).optional()});
export type Interview= z.infer<typeof interviewSchema>;
export type Answer=z.infer<typeof answerSchema>;
