import ffi from 'ffi-rs'
import { execSync } from 'child_process'
import fs from 'fs'
import { Application, GetApplications } from '../types'
import path from 'path'
import plist from 'plist'

function getFileUTI(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  try {
    const uti = execSync(`mdls -name kMDItemContentType -r "${filePath}"`, {
      encoding: 'utf8',
    }).trim()
    return uti || null
  } catch (err) {
    console.error('Error getting UTI:', err)
    return null
  }
}

function getAppPathFromBundleId(bundleId: string): string | null {
  try {
    const appPath = execSync(
      `mdfind "kMDItemCFBundleIdentifier == '${bundleId}'"`,
      { encoding: 'utf8' },
    ).trim()

    if (appPath) {
      return appPath
    } else {
      console.error(`Application with bundle ID '${bundleId}' not found.`)
      return null
    }
  } catch (err) {
    console.error('Error searching for application:', err)
    return null
  }
}

const getBundleIdentifiers = (uniformTypeIdentifier: string) => {
  ffi.open({
    library: 'CoreFoundation',
    path: '/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation',
  })

  ffi.open({
    library: 'CoreServices',
    path: '/System/Library/Frameworks/CoreServices.framework/CoreServices',
  })

  const CoreFoundation = ffi.define({
    CFStringCreateWithCString: {
      library: 'CoreFoundation',
      retType: ffi.DataType.U64,
      paramsType: [ffi.DataType.U64, ffi.DataType.String, ffi.DataType.U64],
    },
    CFRelease: {
      library: 'CoreFoundation',
      retType: ffi.DataType.Void,
      paramsType: [ffi.DataType.U64],
    },
    CFArrayGetCount: {
      library: 'CoreFoundation',
      retType: ffi.DataType.U64,
      paramsType: [ffi.DataType.U64],
    },
    CFArrayGetValueAtIndex: {
      library: 'CoreFoundation',
      retType: ffi.DataType.U64,
      paramsType: [ffi.DataType.U64, ffi.DataType.U64], // CFArrayRef, index
    },
    CFStringGetCStringPtr: {
      library: 'CoreFoundation',
      retType: ffi.DataType.String,
      paramsType: [ffi.DataType.U64, ffi.DataType.U64], // theString, buffer
    },
  })

  const CoreServices = ffi.define({
    LSCopyAllRoleHandlersForContentType: {
      library: 'CoreServices',
      retType: ffi.DataType.U64,
      paramsType: [ffi.DataType.U64, ffi.DataType.I32], // CFStringRef, LSRolesMask
    },
  })

  const kCFStringEncodingUTF8 = 0x08000100
  const kCFAllocatorDefault = 0
  const kLSRolesAll = 0xffffffff // Request all role handlers (viewer, editor)

  const cfString = CoreFoundation.CFStringCreateWithCString([
    kCFAllocatorDefault,
    uniformTypeIdentifier,
    kCFStringEncodingUTF8,
  ])

  const cfArray = CoreServices.LSCopyAllRoleHandlersForContentType([
    cfString,
    kLSRolesAll,
  ])
  const bundleIDs = []
  if (cfArray !== 0) {
    const count = CoreFoundation.CFArrayGetCount([cfArray])
    // console.log(`Number of apps that can open .txt: ${count}`)

    for (let i = 0; i < count; i++) {
      const appCFString = CoreFoundation.CFArrayGetValueAtIndex([cfArray, i])
      const bundleID = CoreFoundation.CFStringGetCStringPtr([appCFString, 0])

      bundleIDs.push(bundleID)
    }

    CoreFoundation.CFRelease([cfArray])
  } else {
    console.log('No apps found that can open .txt files.')
  }

  CoreFoundation.CFRelease([cfString])
  ffi.close('CoreFoundation')
  ffi.close('CoreServices')
  return bundleIDs
}

const appPathToApplication = (appPath: string | null): Application | null => {
  if (!appPath) return null

  try {
    const infoPlistPath = path.join(appPath, 'Contents', 'Info.plist')
    if (fs.existsSync(infoPlistPath)) {
      const plistContent = fs.readFileSync(infoPlistPath, 'utf8')

      // @TODO Fix the typing here
      const parsedPlist = plist.parse(plistContent) as any

      const name =
        parsedPlist.CFBundleDisplayName || parsedPlist.CFBundleName || 'Unknown'

      const iconPath = parsedPlist.CFBundleIconFile
        ? path.join(
            appPath,
            'Contents',
            'Resources',
            parsedPlist.CFBundleIconFile,
          )
        : null

      return {
        name,
        path: appPath,
        iconPath,
      }
    }
  } catch (err) {
    console.error('Error processing app path:', appPath, err)
  }

  return null
}

export const Mac: GetApplications = {
  getApplications: (filePath: string) => {
    const fileUTI = getFileUTI(filePath)
    if (!fileUTI) {
      throw new Error(`${filePath} has not valid UTI.`)
    }

    const bundleIdentifiers = getBundleIdentifiers(fileUTI)
    const appPaths = bundleIdentifiers.map(getAppPathFromBundleId)
    const applications = appPaths
      .map(appPathToApplication)
      .filter((app): app is Application => app !== null)
    return applications
  },
}
