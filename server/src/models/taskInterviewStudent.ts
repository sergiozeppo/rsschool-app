import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Course } from './course';
import { Student } from './student';
import { CourseTask } from './courseTask';

@Entity()
@Unique(['studentId', 'courseId', 'courseTaskId'])
export class TaskInterviewStudent {
  @PrimaryGeneratedColumn() id: number;

  @CreateDateColumn()
  createdDate: string;

  @UpdateDateColumn()
  updatedDate: string;

  @ManyToOne(_ => Student)
  student: Student;

  @Column()
  studentId: number;

  @ManyToOne(_ => Course)
  course: Course;

  @Column({ nullable: true })
  courseId: number;

  @ManyToOne(_ => CourseTask)
  courseTask: CourseTask;

  @Column()
  courseTaskId: number;
}
