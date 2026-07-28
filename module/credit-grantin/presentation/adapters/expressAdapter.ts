import { Request, Response } from "express";
import { IController } from "../ports/IHttp.js";

export function expressAdapter(controller: IController) {
    return async (req: Request, res: Response) => {
        try {
            const response = await controller.handle({ body: req.body });
            return res.status(response.statusCode).json(response.body);
        } catch (error) {
            console.error("[ExpressAdapter] Unhandled HTTP Controller Error:", error);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
    };
}
