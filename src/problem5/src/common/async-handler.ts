// Express 4 does not await async handlers, so a rejected promise would
// otherwise become an unhandled rejection and never reach the error
// middleware. This adapter routes rejections into the `next` pipeline.
import type {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from 'express';

export const asyncHandler =
  (
    fn: (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => Promise<unknown>,
  ): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
