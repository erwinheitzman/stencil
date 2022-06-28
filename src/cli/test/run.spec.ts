import type * as d from '../../declarations';
import * as coreCompiler from '@stencil/core/compiler';
import { mockCompilerSystem, mockConfig, mockLogger as createMockLogger } from '@stencil/core/testing';
import * as ParseFlags from '../parse-flags';
import { run, runTask } from '../run';
import * as BuildTask from '../task-build';
import * as DocsTask from '../task-docs';
import * as GenerateTask from '../task-generate';
import * as HelpTask from '../task-help';
import * as PrerenderTask from '../task-prerender';
import * as ServeTask from '../task-serve';
import * as TelemetryTask from '../task-telemetry';
import * as TestTask from '../task-test';
import { createTestingSystem } from '../../testing/testing-sys';

describe('run', () => {
  describe('run()', () => {
    let cliInitOptions: d.CliInitOptions;
    let mockLogger: d.Logger;
    let mockSystem: d.CompilerSystem;

    let parseFlagsSpy: jest.SpyInstance<
      ReturnType<typeof ParseFlags.parseFlags>,
      Parameters<typeof ParseFlags.parseFlags>
    >;

    beforeEach(() => {
      mockLogger = createMockLogger();
      mockSystem = createTestingSystem();

      cliInitOptions = {
        args: [],
        logger: mockLogger,
        sys: mockSystem,
      };

      parseFlagsSpy = jest.spyOn(ParseFlags, 'parseFlags');
      parseFlagsSpy.mockReturnValue({
        task: 'help',
      });
    });

    afterEach(() => {
      parseFlagsSpy.mockRestore();
    });

    describe('help task', () => {
      let taskHelpSpy: jest.SpyInstance<ReturnType<typeof HelpTask.taskHelp>, Parameters<typeof HelpTask.taskHelp>>;

      beforeEach(() => {
        taskHelpSpy = jest.spyOn(HelpTask, 'taskHelp');
        taskHelpSpy.mockReturnValue(Promise.resolve());
      });

      afterEach(() => {
        taskHelpSpy.mockRestore();
      });

      it("calls the help task when the 'task' field is set to 'help'", () => {
        run(cliInitOptions);

        expect(taskHelpSpy).toHaveBeenCalledTimes(1);
        expect(taskHelpSpy).toHaveBeenCalledWith(
          {
            task: 'help',
            args: [],
          },
          mockLogger,
          mockSystem
        );

        taskHelpSpy.mockRestore();
      });

      it("calls the help task when the 'help' field is set on flags", () => {
        parseFlagsSpy.mockReturnValue({
          help: true,
        });

        run(cliInitOptions);

        expect(taskHelpSpy).toHaveBeenCalledTimes(1);
        expect(taskHelpSpy).toHaveBeenCalledWith(
          {
            task: 'help',
            args: [],
          },
          mockLogger,
          mockSystem
        );

        taskHelpSpy.mockRestore();
      });
    });
  });

  describe('runTask()', () => {
    let sys: d.CompilerSystem;
    let unvalidatedConfig: d.Config;

    let taskBuildSpy: jest.SpyInstance<ReturnType<typeof BuildTask.taskBuild>, Parameters<typeof BuildTask.taskBuild>>;
    let taskDocsSpy: jest.SpyInstance<ReturnType<typeof DocsTask.taskDocs>, Parameters<typeof DocsTask.taskDocs>>;
    let taskGenerateSpy: jest.SpyInstance<
      ReturnType<typeof GenerateTask.taskGenerate>,
      Parameters<typeof GenerateTask.taskGenerate>
    >;
    let taskHelpSpy: jest.SpyInstance<ReturnType<typeof HelpTask.taskHelp>, Parameters<typeof HelpTask.taskHelp>>;
    let taskPrerenderSpy: jest.SpyInstance<
      ReturnType<typeof PrerenderTask.taskPrerender>,
      Parameters<typeof PrerenderTask.taskPrerender>
    >;
    let taskServeSpy: jest.SpyInstance<ReturnType<typeof ServeTask.taskServe>, Parameters<typeof ServeTask.taskServe>>;
    let taskTelemetrySpy: jest.SpyInstance<
      ReturnType<typeof TelemetryTask.taskTelemetry>,
      Parameters<typeof TelemetryTask.taskTelemetry>
    >;
    let taskTestSpy: jest.SpyInstance<ReturnType<typeof TestTask.taskTest>, Parameters<typeof TestTask.taskTest>>;

    beforeEach(() => {
      sys = mockCompilerSystem();
      sys.exit = jest.fn();

      unvalidatedConfig = mockConfig(sys);

      taskBuildSpy = jest.spyOn(BuildTask, 'taskBuild');
      taskBuildSpy.mockResolvedValue();

      taskDocsSpy = jest.spyOn(DocsTask, 'taskDocs');
      taskDocsSpy.mockResolvedValue();

      taskGenerateSpy = jest.spyOn(GenerateTask, 'taskGenerate');
      taskGenerateSpy.mockResolvedValue();

      taskHelpSpy = jest.spyOn(HelpTask, 'taskHelp');
      taskHelpSpy.mockResolvedValue();

      taskPrerenderSpy = jest.spyOn(PrerenderTask, 'taskPrerender');
      taskPrerenderSpy.mockResolvedValue();

      taskServeSpy = jest.spyOn(ServeTask, 'taskServe');
      taskServeSpy.mockResolvedValue();

      taskTelemetrySpy = jest.spyOn(TelemetryTask, 'taskTelemetry');
      taskTelemetrySpy.mockResolvedValue();

      taskTestSpy = jest.spyOn(TestTask, 'taskTest');
      taskTestSpy.mockResolvedValue();
    });

    afterEach(() => {
      taskBuildSpy.mockRestore();
      taskDocsSpy.mockRestore();
      taskGenerateSpy.mockRestore();
      taskHelpSpy.mockRestore();
      taskPrerenderSpy.mockRestore();
      taskServeSpy.mockRestore();
      taskTelemetrySpy.mockRestore();
      taskTestSpy.mockRestore();
    });

    it('calls the help task', () => {
      runTask(coreCompiler, unvalidatedConfig, 'help', sys);

      expect(taskHelpSpy).toHaveBeenCalledTimes(1);
      expect(taskHelpSpy).toHaveBeenCalledWith(unvalidatedConfig.flags, unvalidatedConfig.logger, sys);
    });

    describe('telemetry task', () => {
      it('calls the telemetry task when a compiler system is present', () => {
        runTask(coreCompiler, unvalidatedConfig, 'telemetry', sys);

        expect(taskTelemetrySpy).toHaveBeenCalledTimes(1);
        expect(taskTelemetrySpy).toHaveBeenCalledWith(unvalidatedConfig.flags, sys, unvalidatedConfig.logger);
      });

      it("does not call the telemetry task when a compiler system isn't present", () => {
        runTask(coreCompiler, unvalidatedConfig, 'telemetry');

        expect(taskTelemetrySpy).not.toHaveBeenCalled();
      });
    });

    it('defaults to the help task for an unaccounted for task name', () => {
      // info is a valid task name, but isn't used in the `switch` statement of `runTask`
      runTask(coreCompiler, unvalidatedConfig, 'info', sys);

      expect(taskHelpSpy).toHaveBeenCalledTimes(1);
      expect(taskHelpSpy).toHaveBeenCalledWith(unvalidatedConfig.flags, unvalidatedConfig.logger, sys);
    });
  });
});
