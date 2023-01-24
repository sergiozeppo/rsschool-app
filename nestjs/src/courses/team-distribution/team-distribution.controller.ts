import { Controller, Post, Body, UseGuards, ParseIntPipe, Param, Get, Delete, Put, Req, Query } from '@nestjs/common';
import { TeamDistributionService } from './team-distribution.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CourseGuard, CourseRole, CurrentRequest, DefaultGuard, RequiredRoles, Role, RoleGuard } from 'src/auth';
import {
  TeamDistributionDetailedDto,
  TeamDistributionDto,
  TeamDistributionStudentDto,
  UpdateTeamDistributionDto,
  CreateTeamDistributionDto,
  StudentsWithoutTeamDto,
  TeamDto,
} from './dto';
import { StudentsService } from '../students';
import { Student } from '@entities/index';
import { TeamService } from './team.service';
import { RegisteredStudentOrManagerGuard } from './registered-student-guard';

@Controller('courses/:courseId/team-distribution')
@ApiTags('team distribution')
@UseGuards(DefaultGuard, CourseGuard)
export class TeamDistributionController {
  constructor(
    private readonly teamDistributionService: TeamDistributionService,
    private readonly studentsService: StudentsService,
    private readonly teamService: TeamService,
  ) {}
  @Post('/')
  @UseGuards(RoleGuard)
  @ApiOkResponse({ type: TeamDistributionDto })
  @ApiOperation({ operationId: 'createTeamDistribution' })
  @RequiredRoles([CourseRole.Manager, Role.Admin])
  public async create(@Param('courseId', ParseIntPipe) courseId: number, @Body() dto: CreateTeamDistributionDto) {
    const data = await this.teamDistributionService.create({ courseId, ...dto });
    return new TeamDistributionDto(data);
  }

  @Get('/')
  @ApiOkResponse({ type: [TeamDistributionDto] })
  @ApiOperation({ operationId: 'getCourseTeamDistributions' })
  public async getCourseTeamDistributions(
    @Req() req: CurrentRequest,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    const studentId = req.user.courses[courseId]?.studentId;
    let student: Student | null = null;
    if (studentId) {
      student = await this.studentsService.getStudentWithTeamsAndDistribution(studentId);
    }
    const data = await this.teamDistributionService.findByCourseId(courseId, student);
    return data.map(el => new TeamDistributionDto(el));
  }

  @Delete('/:id')
  @UseGuards(RoleGuard)
  @ApiOkResponse()
  @RequiredRoles([Role.Admin, CourseRole.Manager])
  @ApiOperation({ operationId: 'deleteTeamDistribution' })
  public async delete(@Param('courseId', ParseIntPipe) _: number, @Param('id', ParseIntPipe) id: number) {
    return this.teamDistributionService.remove(id);
  }

  @Put('/:id')
  @UseGuards(RoleGuard)
  @RequiredRoles([Role.Admin, CourseRole.Manager])
  @ApiOkResponse()
  @ApiOperation({ operationId: 'updateTeamDistribution' })
  public async update(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeamDistributionDto,
  ) {
    await this.teamDistributionService.update(id, {
      courseId,
      id: id,
      ...dto,
    });
  }

  @Post('/:id/registry')
  @UseGuards(RoleGuard)
  @ApiOkResponse({ type: TeamDistributionDto })
  @ApiOperation({ operationId: 'teamDistributionRegistry' })
  @RequiredRoles([CourseRole.Student])
  public async registry(
    @Req() req: CurrentRequest,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const teamDistribution = await this.teamDistributionService.getById(id);
    const studentId = req.user.courses[courseId]?.studentId;
    if (studentId) {
      await this.studentsService.addStudentToTeamDistribution(studentId, teamDistribution);
    }
  }

  @Delete('/:id/registry')
  @UseGuards(RoleGuard)
  @ApiOkResponse({ type: TeamDistributionDto })
  @ApiOperation({ operationId: 'teamDistributionDeleteRegistry' })
  @RequiredRoles([CourseRole.Student])
  public async deleteRegistry(
    @Req() req: CurrentRequest,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const teamDistribution = await this.teamDistributionService.getById(id);
    const studentId = req.user.courses[courseId]?.studentId;
    if (studentId) {
      await this.studentsService.deleteStudentFromTeamDistribution(studentId, teamDistribution);
    }
  }

  @Get('/:id/detailed')
  @UseGuards(RoleGuard, RegisteredStudentOrManagerGuard)
  @ApiOkResponse({ type: TeamDistributionDetailedDto })
  @ApiOperation({ operationId: 'getCourseTeamDistributionDetailed' })
  @RequiredRoles([CourseRole.Student, CourseRole.Manager, Role.Admin])
  public async getCourseTeamDistributionDetailed(
    @Req() req: CurrentRequest,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const studentId = req.user.courses[courseId]?.studentId;
    let team;
    if (studentId) {
      const student = await this.studentsService.getStudentWithTeamsAndDistribution(studentId);
      const data = student.teams.find(t => t.teamDistributionId === id);
      if (data) {
        team = await this.teamService.findTeamWithStudentsById(data.id);
        team = new TeamDto(team);
      }
    }
    const distribution = await this.teamDistributionService.getDistributionDetailedById(id);
    return new TeamDistributionDetailedDto(distribution, team);
  }

  @Get('/:id/students')
  @UseGuards(RoleGuard, RegisteredStudentOrManagerGuard)
  @ApiOkResponse({ type: [TeamDistributionStudentDto] })
  @ApiOperation({ operationId: 'getStudentsWithoutTeam' })
  @RequiredRoles([CourseRole.Student, CourseRole.Manager, Role.Admin])
  public async getStudentsWithoutTeam(
    @Param('courseId', ParseIntPipe) _: number,
    @Param('id', ParseIntPipe) id: number,
    @Query('pageSize') pageSize: number = 10,
    @Query('current') current: number = 1,
  ) {
    const { students, paginationMeta } = await this.studentsService.getStudentsByTeamDistributionId(id, {
      page: current,
      limit: pageSize,
    });

    return new StudentsWithoutTeamDto(students, paginationMeta);
  }
}