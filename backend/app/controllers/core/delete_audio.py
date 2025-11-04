# app/controllers/transcription_controller.py

import logging
import shutil
from pathlib import Path

from sqlalchemy.exc import SQLAlchemyError

from app.core.database import SessionLocal
from app.models import Call

logger = logging.getLogger(__name__)

def delete_audio_file(call_id: str) -> bool:
    """
    Delete a Call and its folder. Returns True if deleted, False otherwise.
    """
    db = SessionLocal()
    try:
        call = db.query(Call).get(call_id)
        if not call:
            logger.warning(f"No Call found with id={call_id}")
            return False

        # Resolve and log
        folder = Path(call.folder_path).resolve()
        logger.info(f"[delete_audio_file] Attempting to remove folder: {folder}")

        if folder.exists() and folder.is_dir():
            try:
                shutil.rmtree(folder)
                logger.info(f"[delete_audio_file] Removed folder {folder}")
            except Exception as e:
                logger.error(f"[delete_audio_file] Failed to delete folder {folder}: {e}")
                raise

        else:
            logger.warning(f"[delete_audio_file] Folder does not exist or is not a dir: {folder}")

        # Now delete DB record
        db.delete(call)
        db.commit()
        logger.info(f"[delete_audio_file] Deleted Call {call_id}")
        return True

    except SQLAlchemyError:
        logger.exception(f"DB error while deleting Call {call_id}")
        db.rollback()
        return False
    except Exception:
        # re-raise so you see the stacktrace in your logs
        raise
    finally:
        db.close()


def delete_all_audio_files() -> int:
    """
    Delete every Call and its folder. Returns count deleted.
    """
    db = SessionLocal()
    deleted_count = 0

    try:
        calls = db.query(Call).all()
        if not calls:
            logger.info("No audio files to delete.")
            return 0

        for call in calls:
            folder = Path(call.folder_path).resolve()
            logger.info(f"[delete_all] Removing folder: {folder}")

            if folder.exists() and folder.is_dir():
                try:
                    shutil.rmtree(folder)
                    logger.info(f"[delete_all] Removed folder {folder}")
                except Exception as e:
                    logger.error(f"[delete_all] Failed to delete folder {folder}: {e}")
                    raise

            else:
                logger.warning(f"[delete_all] Folder missing or not dir: {folder}")

            db.delete(call)
            deleted_count += 1

        db.commit()
        logger.info(f"[delete_all] Deleted {deleted_count} Call(s).")
        return deleted_count

    except SQLAlchemyError:
        logger.exception("DB error in delete_all_audio_files")
        db.rollback()
        return 0
    except Exception:
        # So you see any file-system errors immediately
        raise
    finally:
        db.close()


def delete_audio_file(call_id: str) -> bool:
    """
    Delete a specific Call (audio file) and all its associated AudioChunk,
    Segment and Word records, and remove its folder from disk.

    Args:
        call_id: the UUID of the Call to delete.

    Returns:
        True if the Call was found and deleted; False if no such Call existed.
    """
    db = SessionLocal()
    try:
        # 1) load the Call
        call = db.query(Call).get(call_id)
        if not call:
            logger.warning(f"[delete_audio_file] No Call found with id={call_id}")
            return False

        # 2) remove the on‐disk folder
        folder = Path(call.folder_path).resolve()
        logger.info(f"[delete_audio_file] Removing folder: {folder}")
        if folder.exists() and folder.is_dir():
            try:
                shutil.rmtree(folder)
                logger.info(f"[delete_audio_file] Folder removed: {folder}")
            except Exception as e:
                logger.error(f"[delete_audio_file] Failed to delete folder {folder}: {e}")
                raise

        else:
            logger.warning(f"[delete_audio_file] Folder not found or not a directory: {folder}")

        # 3) delete the Call (cascades to chunks → segments → words)
        db.delete(call)
        db.commit()
        logger.info(f"[delete_audio_file] Deleted Call {call_id} and all related data")
        return True

    except SQLAlchemyError:
        logger.exception(f"[delete_audio_file] DB error while deleting Call {call_id}")
        db.rollback()
        return False

    finally:
        db.close()



if __name__=="__main__":
    delete_all_audio_files()