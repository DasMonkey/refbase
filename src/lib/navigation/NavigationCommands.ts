// Command Pattern for Navigation Actions
export interface NavigationCommand {
  type: string;
  payload?: any;
  execute(): void;
}

export class ViewDocumentationCommand implements NavigationCommand {
  type = 'VIEW_DOCUMENTATION';
  
  constructor(private navigationHandler: (route: string) => void) {}
  
  execute(): void {
    this.navigationHandler('/docs');
  }
}

export class NavigationCommandInvoker {
  private commands: Map<string, NavigationCommand> = new Map();
  
  register(commandType: string, command: NavigationCommand): void {
    this.commands.set(commandType, command);
  }
  
  execute(commandType: string): void {
    const command = this.commands.get(commandType);
    if (command) {
      command.execute();
    }
  }
}