import { ChatCompletionTool } from "openai/resources/chat/completions";
import Logger from "./Logger";
import { fetchWeb } from "./tool_functions";

type ToolFunction = (...args: any[]) => any;

interface ToolInfo {
  func: ToolFunction;
  description: string;
  parameters: Record<string, unknown>;
}

export class ToolsManager {
  private tools: Map<string, ToolInfo>;

  constructor() {
    this.tools = new Map();
  }

  public registerDefaultTools() {
    this.registerTool(
      "get_current_weather",
      ({ city }: { city: string }) => {
        return JSON.stringify({
          city: city,
          temperature: "25°C",
          weather: "sunny",
        });
      },
      "Get the current weather for a specified city",
      {
        type: "object",
        properties: {
          city: { type: "string", description: "The name of the city" },
        },
        required: ["city"],
      }
    );
    this.registerTool("fetchWeb", fetchWeb, "fetch a web page content", {
      type: "object",
      properties: {
        url: { type: "string", description: "The url of the web page" },
      },
      required: ["url"],
    });
  }

  public registerTool(
    name: string,
    func: ToolFunction,
    description: string,
    parameters: Record<string, unknown>
  ) {
    this.tools.set(name, { func, description, parameters });
  }

  public async executeTool(name: string, args: any): Promise<string> {
    const toolInfo = this.tools.get(name);
    if (toolInfo) {
      try {
        return JSON.stringify(await toolInfo.func(args));
      } catch (error) {
        Logger.log(`Error executing tool ${name}:`, error);
        return null;
      }
    } else {
      Logger.log(`Tool ${name} not found`);
      return null;
    }
  }

  public getToolsForOpenAI(): ChatCompletionTool[] {
    return Array.from(this.tools.entries()).map(([toolName, toolInfo]) => ({
      type: "function",
      function: {
        name: toolName,
        description: toolInfo.description,
        parameters: toolInfo.parameters,
      },
    }));
  }
}
