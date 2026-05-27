import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { fetchDirectoryItems } from "../api/directoryApi.js";
const DriveContext = createContext();

export const DriveProvider = ({ children }) => {

  const [directoriesList, setDirectoriesList] = useState([]);
  const [filesList, setFilesList] = useState([]);
  const [allFiles,setAllFiles]=useState([]);
  const [alldirectories,setAllDirectories]=useState([]);

  const getDirectoryItems = useCallback(async (dirId) => {
    const data=await fetchDirectoryItems(dirId);
    console.log("data of getDirectoryItems",data)
     setDirectoriesList(data.directories);
     setAllDirectories(data.directories);
     setFilesList(data.files);
     setAllFiles(data.files)
}, []);

  const value = useMemo(() => ({
    directoriesList,
    setDirectoriesList,
    filesList,
    setFilesList,
    allFiles,
    alldirectories,
    getDirectoryItems,
  }), [
    allFiles,
    alldirectories,
    directoriesList,
    filesList,
    getDirectoryItems,
  ]);
 
  return (
    <DriveContext.Provider value={value}>
      {children}
    </DriveContext.Provider>
  );
};

export const useDrive = () => useContext(DriveContext);
