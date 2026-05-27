import {
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileCsv,
  FaFileAudio,
  FaMarkdown,
  FaFilePdf,
  FaFileImage,
  FaFileVideo,
  FaFileArchive,
  FaFileCode,
  FaFileAlt,
} from "react-icons/fa";

export function renderFileIcon(extension) {
  if (!extension) return <FaFileAlt className="file-icon" />;

  // Normalize: convert to lowercase and remove leading dot
  const ext = extension.toLowerCase().replace(/^\./, "");

  if (ext === "pdf") return <FaFilePdf className="file-icon pdf-icon" />;

  // Office-like docs
  if (["doc", "docx", "rtf", "odt"].includes(ext)) {
    return <FaFileWord className="file-icon word-icon" />;
  }

  if (["xls", "xlsx", "ods"].includes(ext)) {
    return <FaFileExcel className="file-icon excel-icon" />;
  }

  if (["ppt", "pptx", "odp", "key"].includes(ext)) {
    return <FaFilePowerpoint className="file-icon ppt-icon" />;
  }

  if (["csv", "tsv"].includes(ext)) {
    return <FaFileCsv className="file-icon csv-icon" />;
  }

  if (["txt", "md", "markdown"].includes(ext)) {
    return ext === "txt"
      ? <FaFileAlt className="file-icon text-icon" />
      : <FaMarkdown className="file-icon markdown-icon" />;
  }

  // Image files
  if (["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "ico", "heic"].includes(ext)) {
    return <FaFileImage className="file-icon image-icon" />;
  }

  // Video files
  if (["mp4", "avi", "mov", "mkv", "wmv", "flv", "webm", "ts", "m4v"].includes(ext)) {
    return <FaFileVideo className="file-icon video-icon" />;
  }

  // Audio files
  if (["mp3", "wav", "aac", "flac", "ogg", "m4a"].includes(ext)) {
    return <FaFileAudio className="file-icon audio-icon" />;
  }

  // Archive files
  if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(ext)) {
    return <FaFileArchive className="file-icon archive-icon" />;
  }

  // Code / data files
  if (
    ["js", "jsx", "ts", "tsx", "py", "java", "cpp", "c", "h", "hpp", "html", "css", "scss", "json", "xml", "sql", "yml", "yaml", "env", "php", "go", "rs"].includes(ext)
  ) {
    return <FaFileCode className="file-icon code-icon" />;
  }

  // Default for unknown types
  return <FaFileAlt className="file-icon" />;
}
