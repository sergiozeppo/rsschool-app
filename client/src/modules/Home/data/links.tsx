import {
  AudioTwoTone,
  CalendarTwoTone,
  CheckCircleTwoTone,
  GoldTwoTone,
  CodeTwoTone,
  DashboardTwoTone,
  FireTwoTone,
  PlayCircleTwoTone,
  StopTwoTone,
  AppstoreOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';
import { Session } from 'components/withSession';
import React from 'react';
import { Course } from 'services/models';
import { isStudent, isAdmin, isMentor, isCourseManager, isActiveStudent, isDementor } from 'domain/user';
import { getAutoTestRoute } from 'services/routes';
import { MenuProps } from 'antd';
import Router from 'next/router';

const anyAccess = () => true;
const isCourseNotCompleted = (_: Session, course: Course) => !course.completed;

const every =
  (...checks: ((session: Session, courseId: number) => boolean)[]) =>
  (session: Session, courseId: number) =>
    checks.every(check => check(session, courseId));

const everyCourse =
  (...checks: ((session: Session, course: Course) => boolean)[]) =>
  (session: Session, course: Course) =>
    checks.every(check => check(session, course));

const some =
  (...checks: ((session: Session, courseId: number) => boolean)[]) =>
  (session: Session, courseId: number) =>
    checks.some(check => check(session, courseId));

export type LinkData = {
  name: string;
  icon?: JSX.Element;
  getUrl: (course: Course) => string;
  access: (session: Session, courseId: number) => boolean;
  courseAccess?: (session: Session, course: Course) => boolean;
  newTab?: boolean;
};

export type LinkRenderData = Pick<LinkData, 'icon' | 'name'> & { url: string };

const links: LinkData[] = [
  {
    name: 'Dashboard',
    icon: <DashboardTwoTone />,
    getUrl: (course: Course) => `/course/student/dashboard?course=${course.alias}`,
    access: every(isStudent),
    courseAccess: everyCourse(isCourseNotCompleted),
  },
  {
    name: 'Dashboard',
    icon: <AppstoreOutlined />,
    getUrl: (course: Course) => `/course/mentor/dashboard?course=${course.alias}`,
    access: every(isMentor),
    courseAccess: everyCourse(isCourseNotCompleted),
  },
  {
    name: 'Score',
    icon: <FireTwoTone twoToneColor="#ffa500" />,
    getUrl: (course: Course) => `/course/score?course=${course.alias}`,
    access: anyAccess,
  },
  {
    name: 'Schedule',
    icon: <CalendarTwoTone twoToneColor="#eb2f96" />,
    getUrl: (course: Course) => `/course/schedule?course=${course.alias}`,
    access: anyAccess,
  },
  {
    name: 'My Students',
    icon: <GoldTwoTone twoToneColor="#7f00ff" />,
    getUrl: (course: Course) => `/course/mentor/students?course=${course.alias}`,
    access: every(isMentor),
  },
  {
    name: 'Cross-Check: Submit',
    icon: <CodeTwoTone />,
    getUrl: (course: Course) => `/course/student/cross-check-submit?course=${course.alias}`,
    access: every(isActiveStudent),
    courseAccess: everyCourse(isCourseNotCompleted),
  },
  {
    name: 'Cross-Check: Review',
    icon: <CheckCircleTwoTone twoToneColor="#f56161" />,
    getUrl: (course: Course) => `/course/student/cross-check-review?course=${course.alias}`,
    access: every(isActiveStudent),
    courseAccess: everyCourse(isCourseNotCompleted),
  },
  {
    name: 'Interviews',
    icon: <AudioTwoTone />,
    getUrl: (course: Course) => `/course/student/interviews?course=${course.alias}`,
    access: every(isStudent),
    courseAccess: everyCourse(isCourseNotCompleted),
  },
  {
    name: 'Interviews',
    icon: <AudioTwoTone twoToneColor="#ffa500" />,
    getUrl: (course: Course) => `/course/mentor/interviews?course=${course.alias}`,
    access: every(isMentor),
    courseAccess: everyCourse(isCourseNotCompleted),
  },
  {
    name: 'Auto-Test',
    icon: <PlayCircleTwoTone twoToneColor="#7f00ff" />,
    getUrl: (course: Course) => getAutoTestRoute(course.alias),
    access: some(isActiveStudent, isCourseManager),
    courseAccess: everyCourse(isCourseNotCompleted),
  },
  {
    name: 'Expel/Unassign Student',
    icon: <StopTwoTone twoToneColor="#ff0000" />,
    getUrl: (course: Course) => `/course/mentor/expel-student?course=${course.alias}`,
    access: every(isMentor),
    courseAccess: everyCourse(isCourseNotCompleted),
  },
  {
    name: 'Team Distributions',
    icon: <UsergroupAddOutlined twoToneColor="#7f00ff" />,
    getUrl: (course: Course) => `/course/team-distributions?course=${course.alias}`,
    access: some(isCourseManager, isActiveStudent, isDementor),
    courseAccess: everyCourse(isCourseNotCompleted),
  },
  {
    name: 'Course Statistics',
    icon: <AppstoreOutlined />,
    getUrl: (course: Course) => `/course/stats?course=${course.alias}`,
    access: anyAccess,
  },
];

export function getCourseLinks(session: Session, activeCourse: Course | null): LinkRenderData[] {
  return activeCourse
    ? links
        .filter(
          route =>
            isAdmin(session) ||
            (route.access(session, activeCourse.id) && (route.courseAccess?.(session, activeCourse) ?? true)),
        )
        .map(({ name, icon, getUrl }) => ({ name, icon, url: getUrl(activeCourse) }))
    : [];
}

export function getNavigationItems(session: Session, activeCourse: Course | null): MenuProps['items'] {
  return activeCourse
    ? links
        .filter(
          route =>
            isAdmin(session) ||
            (route.access(session, activeCourse.id) && (route.courseAccess?.(session, activeCourse) ?? true)),
        )
        .map(({ name, icon, getUrl }) => ({
          label: name,
          icon,
          key: getUrl(activeCourse),
          onClick: () => Router.push(getUrl(activeCourse)),
        }))
    : [];
}
